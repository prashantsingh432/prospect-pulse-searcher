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

  // Get the next available key - prioritize keys with more credits
  const { data: keys, error: keyError } = await supabase
    .from("lusha_api_keys")
    .select("*")
    .eq("category", category)
    .eq("status", "ACTIVE")
    .eq("is_active", true)
    .gt("credits_remaining", 0) // Only get keys with credits > 0
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1);

  // If no keys with credits > 0, try keys with unknown credits (null or not yet checked)
  if (!keys || keys.length === 0) {
    const { data: fallbackKeys, error: fallbackError } = await supabase
      .from("lusha_api_keys")
      .select("*")
      .eq("category", category)
      .eq("status", "ACTIVE")
      .eq("is_active", true)
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(1);
    
    if (fallbackError || !fallbackKeys || fallbackKeys.length === 0) {
      console.log("[Lusha Enrich] No available keys");
      return {
        success: false,
        error: "No available API keys",
        message: "All API keys are exhausted or inactive. Please add more keys or wait for credits to reset.",
      };
    }
    
    keys.push(fallbackKeys[0]);
  }

  if (keyError) {
    console.error("[Lusha Enrich] Database error:", keyError);
    return { success: false, error: "Database error", message: keyError.message };
  }

  const key: LushaKey = keys[0];
  console.log(`[Lusha Enrich] Using key ending ...${key.key_value.slice(-4)} with ${key.credits_remaining} credits`);

  // Call Lusha API using v2/person endpoint with GET method
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (searchParams.linkedinUrl) {
      queryParams.append("linkedInUrl", searchParams.linkedinUrl);
    }
    if (searchParams.firstName) {
      queryParams.append("firstName", searchParams.firstName);
    }
    if (searchParams.lastName) {
      queryParams.append("lastName", searchParams.lastName);
    }
    if (searchParams.companyName) {
      queryParams.append("companyName", searchParams.companyName);
    }

    const lushaUrl = `https://api.lusha.com/v2/person?${queryParams.toString()}`;
    console.log(`[Lusha Enrich] Calling Lusha API: ${lushaUrl}`);

    const lushaResponse = await fetch(lushaUrl, {
      method: "GET",
      headers: {
        "api_key": key.key_value,
      },
    });

    // Get credits from response headers
    const dailyCreditsLeft = lushaResponse.headers.get("x-daily-requests-left");
    const monthlyCreditsLeft = lushaResponse.headers.get("x-monthly-requests-left");
    const creditsLeft = dailyCreditsLeft || monthlyCreditsLeft;
    
    console.log(`[Lusha Enrich] Response status: ${lushaResponse.status}, Daily credits: ${dailyCreditsLeft}, Monthly credits: ${monthlyCreditsLeft}`);

    // Update last_used_at timestamp
    await supabase
      .from("lusha_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id);

    // Handle different response statuses
    if (lushaResponse.status === 200) {
      const data = await lushaResponse.json();

      // Update credits from response header
      if (creditsLeft !== null) {
        const creditsNum = parseInt(creditsLeft);
        console.log(`[Lusha Enrich] Updating key credits to: ${creditsNum}`);
        
        await supabase
          .from("lusha_api_keys")
          .update({ credits_remaining: creditsNum })
          .eq("id", key.id);

        // ONLY mark as exhausted when credits actually reach 0
        if (creditsNum === 0) {
          console.log(`[Lusha Enrich] Key credits exhausted (0), marking as EXHAUSTED`);
          await supabase
            .from("lusha_api_keys")
            .update({ status: "EXHAUSTED" })
            .eq("id", key.id);
        }
      }

      // Extract relevant data from v2 response structure
      let extractedData: any = { 
        success: true,
        creditsUsed: 1,
        creditsRemaining: creditsLeft ? parseInt(creditsLeft) : null,
        keyUsed: `...${key.key_value.slice(-4)}`
      };

      // v2 API response structure: data.contact.data contains the actual contact info
      const contactData = data.contact?.data || data;
      
      if (category === "PHONE_ONLY") {
        const phoneNumbers = contactData.phoneNumbers || [];
        extractedData.phone = phoneNumbers[0]?.e164Format || 
                              phoneNumbers[0]?.internationalFormat || 
                              phoneNumbers[0]?.localFormat || 
                              phoneNumbers[0]?.number || null;
        extractedData.phone2 = phoneNumbers[1]?.e164Format || 
                               phoneNumbers[1]?.internationalFormat || 
                               phoneNumbers[1]?.localFormat || 
                               phoneNumbers[1]?.number || null;
        extractedData.phone3 = phoneNumbers[2]?.e164Format || 
                               phoneNumbers[2]?.internationalFormat || 
                               phoneNumbers[2]?.localFormat || 
                               phoneNumbers[2]?.number || null;
        extractedData.phone4 = phoneNumbers[3]?.e164Format || 
                               phoneNumbers[3]?.internationalFormat || 
                               phoneNumbers[3]?.localFormat || 
                               phoneNumbers[3]?.number || null;
        extractedData.phoneNumbers = phoneNumbers;
      } else if (category === "EMAIL_ONLY") {
        const emails = contactData.emailAddresses || [];
        extractedData.email = emails[0]?.email || null;
        extractedData.emails = emails;
      }

      // Extract additional fields
      extractedData.fullName = contactData.fullName || contactData.name || null;
      extractedData.company = contactData.company?.name || 
                              contactData.currentPosition?.company?.name ||
                              contactData.employmentHistory?.[0]?.company?.name || null;
      extractedData.companyLinkedInUrl = contactData.company?.linkedinUrl || 
                                          contactData.company?.linkedin_url ||
                                          contactData.currentPosition?.company?.linkedinUrl || null;
      extractedData.title = contactData.currentPosition?.title || 
                            contactData.title || 
                            contactData.jobTitle || null;
      extractedData.city = contactData.location?.city || contactData.city || null;
      extractedData.rawData = data;

      console.log(`[Lusha Enrich] Success! Extracted:`, {
        phone: extractedData.phone,
        email: extractedData.email,
        fullName: extractedData.fullName,
        company: extractedData.company,
        creditsRemaining: extractedData.creditsRemaining
      });

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
    } else if (lushaResponse.status === 402) {
      // 402 = Out of credits - mark as exhausted and retry with next key
      console.log(`[Lusha Enrich] Key out of credits (402), marking as EXHAUSTED`);
      await supabase
        .from("lusha_api_keys")
        .update({ status: "EXHAUSTED", credits_remaining: 0 })
        .eq("id", key.id);

      if (attempt < maxAttempts) {
        return await enrichWithRetry(supabase, searchParams, category, masterProspectId, attempt + 1);
      }

      return { success: false, error: "No credits", message: "All available keys are out of credits" };
    } else if (lushaResponse.status === 429) {
      // 429 = Rate limited - retry with same key after checking if it has credits
      console.log(`[Lusha Enrich] Rate limited (429), checking credits...`);
      
      // If we know credits are 0, mark as exhausted
      if (creditsLeft && parseInt(creditsLeft) === 0) {
        await supabase
          .from("lusha_api_keys")
          .update({ status: "EXHAUSTED", credits_remaining: 0 })
          .eq("id", key.id);
      }

      if (attempt < maxAttempts) {
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await enrichWithRetry(supabase, searchParams, category, masterProspectId, attempt + 1);
      }

      return { success: false, error: "Rate limit", message: "Rate limited, please try again later" };
    } else if (lushaResponse.status === 401) {
      // Invalid key
      console.log(`[Lusha Enrich] Invalid key (401), marking as INVALID`);
      await supabase
        .from("lusha_api_keys")
        .update({ status: "INVALID" })
        .eq("id", key.id);

      if (attempt < maxAttempts) {
        return await enrichWithRetry(supabase, searchParams, category, masterProspectId, attempt + 1);
      }

      return { success: false, error: "Invalid key", message: "All available keys are invalid" };
    } else if (lushaResponse.status === 404) {
      // Contact not found - don't mark key as bad, just return not found
      console.log(`[Lusha Enrich] Contact not found (404)`);
      
      // Still update credits since call was made
      if (creditsLeft !== null) {
        await supabase
          .from("lusha_api_keys")
          .update({ credits_remaining: parseInt(creditsLeft) })
          .eq("id", key.id);
      }

      return { 
        success: false, 
        error: "Not found", 
        message: "Contact not found in Lusha database",
        creditsRemaining: creditsLeft ? parseInt(creditsLeft) : null,
        keyUsed: `...${key.key_value.slice(-4)}`
      };
    } else {
      // Other error
      const errorText = await lushaResponse.text();
      console.error(`[Lusha Enrich] API error: ${lushaResponse.status} - ${errorText}`);
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
