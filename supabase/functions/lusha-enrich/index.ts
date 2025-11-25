import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LushaKey {
  id: string;
  key_value: string;
  category: string;
  credits_remaining: number;
  status: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { linkedinUrl, firstName, lastName, companyName, category, masterProspectId } = await req.json();

    // Validate: Either linkedinUrl OR (firstName + companyName) must be present
    if (!category) {
      return new Response(
        JSON.stringify({ error: "category is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!linkedinUrl && (!firstName || !companyName)) {
      return new Response(
        JSON.stringify({ error: "Either linkedinUrl OR (firstName + companyName) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (category !== "PHONE_ONLY" && category !== "EMAIL_ONLY") {
      return new Response(
        JSON.stringify({ error: "category must be PHONE_ONLY or EMAIL_ONLY" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Lusha Enrich] Starting enrichment for category: ${category}`);

    // Attempt to enrich with retry logic
    const result = await enrichWithRetry(
      supabaseAdmin, 
      { linkedinUrl, firstName, lastName, companyName }, 
      category, 
      masterProspectId
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[Lusha Enrich] Error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Server error", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function enrichWithRetry(
  supabase: any,
  searchParams: { linkedinUrl?: string; firstName?: string; lastName?: string; companyName?: string },
  category: string,
  masterProspectId?: string,
  attempt = 1
): Promise<any> {
  const maxAttempts = 10;

  console.log(`[Lusha Enrich] Attempt ${attempt} of ${maxAttempts}`);

  // Get the next available key
  const { data: keys, error: keyError } = await supabase
    .from("lusha_api_keys")
    .select("*")
    .eq("category", category)
    .eq("status", "ACTIVE")
    .eq("is_active", true)
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1);

  if (keyError) {
    console.error("[Lusha Enrich] Database error:", keyError);
    return { success: false, error: "Database error", message: keyError.message };
  }

  if (!keys || keys.length === 0) {
    console.log("[Lusha Enrich] No available keys");
    return {
      success: false,
      error: "No available API keys",
      message: "All API keys are exhausted or inactive. Please add more keys or wait for credits to reset.",
    };
  }

  const key: LushaKey = keys[0];
  console.log(`[Lusha Enrich] Using key ${key.id.substring(0, 8)}... with ${key.credits_remaining} credits`);

  // Call Lusha API
  try {
    // Build request body based on available parameters
    const lushaProperties: any = {};
    
    if (searchParams.linkedinUrl) {
      lushaProperties.linkedInUrl = searchParams.linkedinUrl;
    } else if (searchParams.firstName || searchParams.companyName) {
      if (searchParams.firstName) lushaProperties.firstName = searchParams.firstName;
      if (searchParams.lastName) lushaProperties.lastName = searchParams.lastName;
      if (searchParams.companyName) lushaProperties.company = searchParams.companyName;
    }

    console.log(`[Lusha Enrich] Request properties:`, lushaProperties);

    const lushaResponse = await fetch("https://api.lusha.com/person", {
      method: "POST",
      headers: {
        "api_key": key.key_value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: lushaProperties,
      }),
    });

    const creditsLeft = lushaResponse.headers.get("x-daily-requests-left");
    console.log(`[Lusha Enrich] Response status: ${lushaResponse.status}, Credits left: ${creditsLeft}`);

    // Update last_used_at
    await supabase
      .from("lusha_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id);

    // Handle different response statuses
    if (lushaResponse.status === 200) {
      const data = await lushaResponse.json();

      // Update credits
      if (creditsLeft) {
        await supabase
          .from("lusha_api_keys")
          .update({ credits_remaining: parseInt(creditsLeft) })
          .eq("id", key.id);

        // Mark as exhausted if no credits left
        if (parseInt(creditsLeft) === 0) {
          console.log(`[Lusha Enrich] Key exhausted, marking as EXHAUSTED`);
          await supabase
            .from("lusha_api_keys")
            .update({ status: "EXHAUSTED" })
            .eq("id", key.id);
        }
      }

      // Extract relevant data based on category
      let extractedData: any = { success: true };

      if (category === "PHONE_ONLY") {
        extractedData.phone = data.phoneNumbers?.[0]?.e164Format || 
                              data.phoneNumbers?.[0]?.internationalFormat || 
                              data.phoneNumbers?.[0]?.localFormat || null;
        extractedData.phoneNumbers = data.phoneNumbers || [];
      } else if (category === "EMAIL_ONLY") {
        extractedData.email = data.emailAddresses?.[0]?.email || null;
        extractedData.emails = data.emailAddresses || [];
      }

      extractedData.fullName = data.name || null;
      extractedData.company = data.company?.name || null;
      extractedData.title = data.title || null;
      extractedData.rawData = data;

      console.log(`[Lusha Enrich] Success! Extracted data:`, extractedData);

      // Update master_prospects if masterProspectId is provided
      if (masterProspectId && extractedData.phone) {
        await supabase
          .from("master_prospects")
          .update({ prospect_number: extractedData.phone })
          .eq("id", masterProspectId);
      } else if (masterProspectId && extractedData.email) {
        await supabase
          .from("master_prospects")
          .update({ prospect_email: extractedData.email })
          .eq("id", masterProspectId);
      }

      return extractedData;
    } else if (lushaResponse.status === 429 || (creditsLeft && parseInt(creditsLeft) === 0)) {
      // Rate limited or no credits - mark as exhausted and retry
      console.log(`[Lusha Enrich] Key rate limited or exhausted, marking as EXHAUSTED`);
      await supabase
        .from("lusha_api_keys")
        .update({ status: "EXHAUSTED", credits_remaining: 0 })
        .eq("id", key.id);

      if (attempt < maxAttempts) {
        return await enrichWithRetry(supabase, searchParams, category, masterProspectId, attempt + 1);
      }

      return { success: false, error: "Rate limit", message: "All available keys are rate limited" };
    } else if (lushaResponse.status === 401) {
      // Invalid key
      console.log(`[Lusha Enrich] Invalid key, marking as INVALID`);
      await supabase
        .from("lusha_api_keys")
        .update({ status: "INVALID" })
        .eq("id", key.id);

      if (attempt < maxAttempts) {
        return await enrichWithRetry(supabase, searchParams, category, masterProspectId, attempt + 1);
      }

      return { success: false, error: "Invalid key", message: "All available keys are invalid" };
    } else {
      // Other error
      const errorText = await lushaResponse.text();
      console.error(`[Lusha Enrich] API error: ${errorText}`);
      return {
        success: false,
        error: "API error",
        message: `Lusha API returned ${lushaResponse.status}: ${errorText}`,
      };
    }
  } catch (fetchError: any) {
    console.error(`[Lusha Enrich] Fetch error:`, fetchError);
    return { success: false, error: "Network error", message: fetchError.message };
  }
}
