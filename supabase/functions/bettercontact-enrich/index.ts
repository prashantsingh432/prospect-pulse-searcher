import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const betterContactKey = Deno.env.get("BETTERCONTACT_API_KEY");
    if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ success: false, error: "Server configuration error" }, 500);
    if (!betterContactKey) return jsonResponse({ success: false, error: "BetterContact is not configured", message: "Add the BetterContact API key in project secrets." }, 503);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData.user) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

    const metadata = authData.user.user_metadata || {};
    const isSuperAdmin = metadata.project_name === "ADMIN" && (!metadata.admin_level || metadata.admin_level === "super");
    if (!isSuperAdmin) return jsonResponse({ success: false, error: "Super Admin access required" }, 403);

    const body = await request.json().catch(() => null);
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const companyDomain = typeof body?.companyDomain === "string" ? body.companyDomain.trim() : "";
    const linkedinUrl = typeof body?.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";
    const mode: Mode = body?.mode === "phone" || body?.mode === "email" || body?.mode === "both" ? body.mode : "both";

    if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100 || !companyDomain || companyDomain.length > 255) {
      return jsonResponse({ success: false, error: "Invalid input", message: "First name, last name, and company domain are required." }, 400);
    }
    if (linkedinUrl && linkedinUrl.length > 500) return jsonResponse({ success: false, error: "Invalid LinkedIn URL" }, 400);

    const createResponse = await fetch("https://app.bettercontact.rocks/api/v2/async", {
      method: "POST",
      headers: { "X-API-Key": betterContactKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        enrich_email_address: mode === "email" || mode === "both",
        enrich_phone_number: mode === "phone" || mode === "both",
        data: [{
          first_name: firstName,
          last_name: lastName,
          company_domain: companyDomain,
          ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
        }],
      }),
    });
    const createBody = await createResponse.json().catch(() => ({}));
    if (!createResponse.ok || typeof createBody.id !== "string") {
      return jsonResponse({ success: false, error: createBody.error || createBody.message || `BetterContact HTTP ${createResponse.status}`, rawData: createBody }, createResponse.status >= 400 ? createResponse.status : 502);
    }

    let completedBody: Record<string, unknown> = {};
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await wait(1500);
      const resultResponse = await fetch(`https://app.bettercontact.rocks/api/v2/async/${encodeURIComponent(createBody.id)}`, {
        headers: { "X-API-Key": betterContactKey },
      });
      completedBody = await resultResponse.json().catch(() => ({}));
      if (completedBody.status === "terminated") break;
      if (completedBody.status === "on_hold") return jsonResponse({ success: false, error: "BetterContact request is on hold", message: "BetterContact needs more credits to finish this request.", rawData: completedBody }, 402);
    }

    if (completedBody.status !== "terminated") return jsonResponse({ success: false, error: "BetterContact timed out", message: "The request is still processing. Please try again shortly.", rawData: completedBody }, 504);

    const contact = Array.isArray(completedBody.data) ? completedBody.data[0] : null;
    const email = typeof contact?.contact_email_address === "string" ? contact.contact_email_address : null;
    const phone = typeof contact?.contact_phone_number === "string" ? contact.contact_phone_number : null;
    const hasRequestedData = mode === "phone" ? Boolean(phone) : mode === "email" ? Boolean(email) : Boolean(phone || email);

    return jsonResponse({
      success: hasRequestedData,
      phone: mode === "email" ? null : phone,
      email: mode === "phone" ? null : email,
      fullName: contact?.contact_full_name || `${firstName} ${lastName}`,
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