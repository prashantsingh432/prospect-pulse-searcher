import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "phone" | "email" | "both";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ success: false, error: "Server configuration error" }, 500);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData.user) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

    const metadata = authData.user.user_metadata || {};
    const isAdmin =
      metadata.project_name === "ADMIN" ||
      metadata.admin_level === "super" ||
      metadata.admin_level === "sub" ||
      metadata.role === "admin";
    if (!isAdmin) return jsonResponse({ success: false, error: "Admin access required" }, 403);

    const body = await request.json().catch(() => null);

    // Balance check / sync action
    if (body?.action === "sync_balances") {
      let query = adminClient
        .from("bettercontact_api_keys")
        .select("id,key_value");
      if (typeof body.keyId === "string" && body.keyId) {
        query = query.eq("id", body.keyId);
      }
      const { data: keysToCheck, error: fetchErr } = await query;
      if (fetchErr) return jsonResponse({ success: false, error: fetchErr.message }, 500);

      const results = [];
      for (const k of keysToCheck || []) {
        try {
          const resp = await fetch("https://app.bettercontact.rocks/api/v2/account", {
            headers: { "X-API-Key": k.key_value },
          });
          const accData = await resp.json().catch(() => ({}));
          if (resp.ok && accData.success !== false && accData.credits_left !== undefined) {
            const credits = parseFloat(accData.credits_left) || 0;
            const email = typeof accData.email === "string" ? accData.email : null;
            const status = credits > 0 ? "ACTIVE" : "EXHAUSTED";
            const isActive = credits > 0;
            await adminClient
              .from("bettercontact_api_keys")
              .update({
                credits_remaining: credits,
                account_email: email,
                status,
                is_active: isActive,
              })
              .eq("id", k.id);
            results.push({ id: k.id, credits, email, status, is_active: isActive });
          } else {
            const isInvalid = resp.status === 401 || resp.status === 403;
            await adminClient
              .from("bettercontact_api_keys")
              .update({
                status: isInvalid ? "INVALID" : "EXHAUSTED",
                is_active: false,
              })
              .eq("id", k.id);
            results.push({ id: k.id, status: isInvalid ? "INVALID" : "EXHAUSTED", is_active: false });
          }
        } catch (e) {
          results.push({ id: k.id, error: e instanceof Error ? e.message : "Network error" });
        }
      }

      return jsonResponse({
        success: true,
        message: `Synced ${results.length} key balance(s)`,
        results,
      });
    }

    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const companyDomain = typeof body?.companyDomain === "string" ? body.companyDomain.trim() : "";
    const linkedinUrl = typeof body?.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";
    const mode: Mode = body?.mode === "phone" || body?.mode === "email" || body?.mode === "both" ? body.mode : "both";

    const hasNameAndCompany = Boolean(firstName && lastName && companyDomain);
    if (!linkedinUrl && !hasNameAndCompany) {
      return jsonResponse({ success: false, error: "Invalid input", message: "Enter a LinkedIn URL, or provide first name, last name, and company domain." }, 400);
    }
    if (firstName.length > 100 || lastName.length > 100 || companyDomain.length > 255) {
      return jsonResponse({ success: false, error: "Invalid input", message: "One or more input fields are too long." }, 400);
    }
    if (linkedinUrl && linkedinUrl.length > 500) return jsonResponse({ success: false, error: "Invalid LinkedIn URL" }, 400);

    const { data: poolKeys, error: poolError } = await adminClient
      .from("bettercontact_api_keys")
      .select("id,key_value,status,is_active,last_used_at")
      .eq("is_active", true)
      .eq("status", "ACTIVE")
      .order("last_used_at", { ascending: true, nullsFirst: true });
    if (poolError) console.error("[BetterContact Enrich] Key pool lookup failed:", poolError.message);

    const candidateKeys = (poolKeys || []).map((key) => ({ id: key.id as string | null, value: key.key_value as string })).filter((key) => key.value);
    const fallbackKey = Deno.env.get("BETTERCONTACT_API_KEY");
    if (fallbackKey && !candidateKeys.some((key) => key.value === fallbackKey)) candidateKeys.push({ id: null, value: fallbackKey });
    if (!candidateKeys.length) return jsonResponse({ success: false, error: "BetterContact is not configured", message: "Add BetterContact keys to the key pool." }, 503);

    const requestPayload = {
      enrich_email_address: mode === "email" || mode === "both",
      enrich_phone_number: mode === "phone" || mode === "both",
      data: [{
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
        ...(companyDomain ? { company_domain: companyDomain } : {}),
        ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
      }],
    };

    let completedBody: Record<string, unknown> = {};
    let requestFailure: { status: number; body: Record<string, unknown> } | null = null;
    let usedKeyId: string | null = null;
    for (const candidate of candidateKeys) {
      const createResponse = await fetch("https://app.bettercontact.rocks/api/v2/async", {
        method: "POST",
        headers: { "X-API-Key": candidate.value, "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      const createBody = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok || typeof createBody.id !== "string") {
        requestFailure = { status: createResponse.status, body: createBody };
        if (candidate.id && [401, 402, 403, 429].includes(createResponse.status)) {
          await adminClient.from("bettercontact_api_keys").update({ status: createResponse.status === 401 || createResponse.status === 403 ? "INVALID" : "EXHAUSTED", is_active: false }).eq("id", candidate.id);
          continue;
        }
        break;
      }

      usedKeyId = candidate.id;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        await wait(1500);
        const resultResponse = await fetch(`https://app.bettercontact.rocks/api/v2/async/${encodeURIComponent(createBody.id)}`, { headers: { "X-API-Key": candidate.value } });
        completedBody = await resultResponse.json().catch(() => ({}));
        if (completedBody.status === "terminated") break;
        if (completedBody.status === "on_hold") {
          requestFailure = { status: 402, body: completedBody };
          break;
        }
      }
      if (completedBody.status === "terminated") break;
      if (candidate.id) await adminClient.from("bettercontact_api_keys").update({ status: "EXHAUSTED", is_active: false }).eq("id", candidate.id);
    }

    if (usedKeyId) {
      const updates: Record<string, unknown> = { last_used_at: new Date().toISOString() };
      const candidateObj = candidateKeys.find((c) => c.id === usedKeyId);
      if (candidateObj?.value) {
        try {
          const accResp = await fetch("https://app.bettercontact.rocks/api/v2/account", {
            headers: { "X-API-Key": candidateObj.value },
          });
          const accJson = await accResp.json().catch(() => ({}));
          if (accResp.ok && accJson.credits_left !== undefined) {
            const rem = parseFloat(accJson.credits_left) || 0;
            updates.credits_remaining = rem;
            if (accJson.email) updates.account_email = accJson.email;
            if (rem <= 0) {
              updates.status = "EXHAUSTED";
              updates.is_active = false;
            }
          }
        } catch (_) {}
      }
      await adminClient.from("bettercontact_api_keys").update(updates).eq("id", usedKeyId);
    }
    if (completedBody.status !== "terminated") {
      if (requestFailure) return jsonResponse({ success: false, error: requestFailure.body.error || requestFailure.body.message || `BetterContact HTTP ${requestFailure.status}`, rawData: requestFailure.body }, requestFailure.status >= 400 ? requestFailure.status : 502);
      return jsonResponse({ success: false, error: "BetterContact timed out", message: "The request is still processing. Please try again shortly.", rawData: completedBody }, 504);
    }

    const contact = Array.isArray(completedBody.data) ? completedBody.data[0] : null;
    const email = typeof contact?.contact_email_address === "string" ? contact.contact_email_address : null;
    const phone = typeof contact?.contact_phone_number === "string" ? contact.contact_phone_number : null;
    const hasRequestedData = mode === "phone" ? Boolean(phone) : mode === "email" ? Boolean(email) : Boolean(phone || email);

    return jsonResponse({
      success: hasRequestedData,
      phone: mode === "email" ? null : phone,
      email: mode === "phone" ? null : email,
       fullName: contact?.contact_full_name || [firstName, lastName].filter(Boolean).join(" ") || null,
      company: contact?.company_name || null,
      title: contact?.contact_job_title || null,
      city: contact?.contact_location_city || null,
      message: hasRequestedData ? "Successfully retrieved contact information from BetterContact" : "No requested contact data was found",
      rawData: contact,
    });
  } catch (error) {
    console.error("[BetterContact Enrich] Error:", error);
    return jsonResponse({ success: false, error: "Server error", message: error instanceof Error ? error.message : "Unable to complete BetterContact enrichment." }, 500);
  }
});