import { supabase } from "@/integrations/supabase/client";

export type LushaCategory = "PHONE_ONLY" | "EMAIL_ONLY";
export type LushaKeyStatus = "ACTIVE" | "EXHAUSTED" | "INVALID" | "SUSPENDED";

export interface LushaApiKey {
  id: string;
  key_value: string;
  category: LushaCategory;
  credits_remaining: number;
  last_used_at: string | null;
  status: LushaKeyStatus;
  is_active: boolean;
  created_at: string;
}

export interface LushaEnrichResult {
  success: boolean;
  phone?: string | null;
  phone2?: string | null;
  phone3?: string | null;
  phone4?: string | null;
  email?: string | null;
  fullName?: string | null;
  company?: string | null;
  companyLinkedInUrl?: string | null;
  title?: string | null;
  city?: string | null;
  error?: string;
  message?: string;
  rawData?: any;
  creditsRemaining?: number | null;
  keyUsed?: string;
}

/**
 * Fetch all Lusha API keys (Admin only)
 */
export async function fetchLushaKeys(): Promise<LushaApiKey[]> {
  const { data, error } = await supabase
    .from("lusha_api_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Lusha keys:", error);
    throw error;
  }

  return (data || []) as LushaApiKey[];
}

/**
 * Add new Lusha API keys in bulk
 */
export async function addLushaKeys(
  keys: string[],
  category: LushaCategory
): Promise<{ success: boolean; added: number; errors: string[] }> {
  const results = { success: true, added: 0, errors: [] as string[] };

  for (const key of keys) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;

    try {
      const { error } = await supabase.from("lusha_api_keys").insert({
        key_value: trimmedKey,
        category: category,
        status: "ACTIVE",
        is_active: true,
      });

      if (error) {
        results.errors.push(`${trimmedKey.substring(0, 10)}...: ${error.message}`);
      } else {
        results.added++;
      }
    } catch (err: any) {
      results.errors.push(`${trimmedKey.substring(0, 10)}...: ${err.message}`);
    }
  }

  results.success = results.errors.length === 0;
  return results;
}

/**
 * Toggle active status of a key
 */
export async function toggleLushaKeyStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("lusha_api_keys")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Delete a Lusha API key
 */
export async function deleteLushaKey(id: string): Promise<void> {
  const { error } = await supabase.from("lusha_api_keys").delete().eq("id", id);

  if (error) throw error;
}

/**
 * Helper function to split full name into first and last name
 */
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmedName = fullName.trim();
  const firstSpaceIndex = trimmedName.indexOf(" ");

  if (firstSpaceIndex === -1) {
    // Single word name
    return { firstName: trimmedName, lastName: "" };
  }

  return {
    firstName: trimmedName.substring(0, firstSpaceIndex),
    lastName: trimmedName.substring(firstSpaceIndex + 1),
  };
}

/**
 * Smart Key Rotation: Fetch all active keys for a category
 * Orders by last_used_at (null first) to implement round-robin like Python script
 */
async function getActiveKeysForCategory(category: LushaCategory): Promise<LushaApiKey[]> {
  console.log(`\n🔍 [getActiveKeysForCategory] Fetching keys for category: ${category}`);
  console.log(`🔍 [getActiveKeysForCategory] Query filters: category=${category}, is_active=true, status=ACTIVE`);

  // 🔥 CRITICAL: Use DESCENDING order to get the MOST recently used key first
  // This ensures we keep using the SAME key until it's exhausted (credits = 0)
  // Only then will it be marked EXHAUSTED and we'll fall through to the next key
  const { data, error } = await supabase
    .from("lusha_api_keys")
    .select("*")
    .eq("category", category)
    .eq("is_active", true)
    .eq("status", "ACTIVE") // 🔥 CRITICAL: Only fetch keys with ACTIVE status
    .order("last_used_at", { ascending: false, nullsFirst: false }); // 🔥 MOST recently used first - stick with same key until exhausted

  if (error) {
    console.error(`❌ Error fetching ${category} keys:`, error);
    return [];
  }

  console.log(`🔍 [getActiveKeysForCategory] Found ${data?.length || 0} keys`);
  if (data && data.length > 0) {
    console.log(`🔍 [getActiveKeysForCategory] Keys:`, data.map(k => ({
      ending: k.key_value.slice(-4),
      category: k.category,
      status: k.status,
      is_active: k.is_active,
      credits: k.credits_remaining
    })));
  }

  return (data || []) as LushaApiKey[];
}

/**
 * Mark a key as exhausted or invalid
 */
async function markKeyAsDead(keyId: string, status: "EXHAUSTED" | "INVALID"): Promise<void> {
  const { error } = await supabase
    .from("lusha_api_keys")
    .update({ status, is_active: false })
    .eq("id", keyId);

  if (error) {
    console.error(`❌ Error marking key as ${status}:`, error);
  }
}

/**
 * Update key's last_used_at timestamp
 */
async function updateKeyLastUsed(keyId: string): Promise<void> {
  const { error } = await supabase
    .from("lusha_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyId);

  if (error) {
    console.error("❌ Error updating key last_used_at:", error);
  }
}

/**
 * Make API call to Lusha via Supabase Edge Function (server-side proxy)
 * 🔥 HARDCODED PRODUCTION URL - Direct fetch to ensure it reaches the function
 */
async function makeLushaApiCall(
  apiKey: string,
  params: {
    linkedinUrl?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }
): Promise<{ status: number; data: any; error?: string }> {
  // 🔥 HARDCODED PRODUCTION URL - DO NOT USE supabase.functions.invoke()
  const EDGE_FUNCTION_URL = "https://lodpoepylygsryjdkqjg.supabase.co/functions/v1/lusha-enrich-proxy";

  try {
    console.log(`\n📡 Calling Lusha API via Direct Fetch to Edge Function`);
    console.log(`🌐 URL: ${EDGE_FUNCTION_URL}`);
    console.log(`🔑 Using API key ending in ...${apiKey.slice(-4)}`);
    console.log(`📋 Parameters:`, params);

    const payload = {
      apiKey: apiKey,
      params: params,
    };

    try {
      console.log(`📤 Sending payload:`, JSON.stringify(payload, null, 2));
    } catch {
      console.log(`📤 Sending payload: [Unable to stringify]`);
    }

    // Direct fetch() call to production edge function
    // 🔥 CRITICAL: Only Content-Type header - no Authorization/apikey to avoid CORS preflight
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response OK: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      return {
        status: response.status,
        data: null,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const responseData = await response.json();
    try {
      console.log(`📊 Response Data:`, JSON.stringify(responseData, null, 2));
    } catch {
      console.log(`📊 Response Data: [Unable to stringify - showing type]`, typeof responseData);
    }

    return {
      status: responseData?.status || response.status,
      data: responseData?.data,
      error: responseData?.error,
    };
  } catch (err: any) {
    console.error(`❌ Network/Fetch Error:`, err);
    console.error(`📋 Error Message:`, err.message);
    console.error(`📋 Error Stack:`, err.stack);
    return {
      status: 0,
      data: null,
      error: `Network Error: ${err.message}`,
    };
  }
}

/**
 * Parse Lusha API response and extract contact data
 */
function parseLushaResponse(data: any): LushaEnrichResult {
  try {
    // Safe logging - prevent crash if data is circular or undefined
    try {
      console.log("🔍 [parseLushaResponse] Raw data:", JSON.stringify(data, null, 2));
    } catch (logError) {
      console.log("🔍 [parseLushaResponse] Raw data: [Unable to stringify - circular reference or error]");
      console.log("🔍 [parseLushaResponse] Data type:", typeof data);
    }

    // Lusha returns contact data in different formats
    const contact = data?.contact?.data || data?.data || data;

    console.log("🔍 [parseLushaResponse] Extracted contact:", contact ? "EXISTS" : "NULL");
    try {
      console.log("🔍 [parseLushaResponse] Contact keys:", contact ? Object.keys(contact) : "N/A");
    } catch {
      console.log("🔍 [parseLushaResponse] Contact keys: [Error getting keys]");
    }

    if (!contact) {
      return {
        success: false,
        error: "No contact data",
        message: "No contact information found in response",
      };
    }

    // Extract ALL phone numbers (up to 4) - handle both camelCase and snake_case
    let phone: string | null = null;
    let phone2: string | null = null;
    let phone3: string | null = null;
    let phone4: string | null = null;
    
    const phones = contact.phone_numbers || contact.phoneNumbers || [];
    console.log("🔍 [parseLushaResponse] Phone numbers array:", phones);
    
    if (phones.length > 0) {
      phone = phones[0].internationalNumber || phones[0].international_number || phones[0].number || null;
      console.log("🔍 [parseLushaResponse] Extracted phone 1:", phone);
    }
    if (phones.length > 1) {
      phone2 = phones[1].internationalNumber || phones[1].international_number || phones[1].number || null;
      console.log("🔍 [parseLushaResponse] Extracted phone 2:", phone2);
    }
    if (phones.length > 2) {
      phone3 = phones[2].internationalNumber || phones[2].international_number || phones[2].number || null;
      console.log("🔍 [parseLushaResponse] Extracted phone 3:", phone3);
    }
    if (phones.length > 3) {
      phone4 = phones[3].internationalNumber || phones[3].international_number || phones[3].number || null;
      console.log("🔍 [parseLushaResponse] Extracted phone 4:", phone4);
    }


    // Extract email addresses - handle both camelCase and snake_case
    let email: string | null = null;
    const emails = contact.email_addresses || contact.emailAddresses || [];
    console.log("🔍 [parseLushaResponse] Email addresses array:", emails);
    if (emails.length > 0) {
      email = emails[0].email || null;
      console.log("🔍 [parseLushaResponse] Extracted email:", email);
    }

    // Extract other fields - handle multiple API response formats
    const currentPos = contact.currentPosition || contact.current_position;
    const history = contact.employmentHistory || contact.employment_history;
    
    console.log("🔍 [parseLushaResponse] contact.company:", contact.company);
    console.log("🔍 [parseLushaResponse] contact.jobTitle:", contact.jobTitle);
    console.log("🔍 [parseLushaResponse] currentPos:", currentPos ? "EXISTS" : "NULL");
    console.log("🔍 [parseLushaResponse] history:", history ? "EXISTS" : "NULL");
    
    const fullName = contact.fullName || contact.full_name || null;
    
    // Company name - check direct property first, then nested
    const company = 
      contact.company?.name || 
      currentPos?.company?.name || 
      history?.[0]?.company?.name || 
      null;
    console.log("🔍 [parseLushaResponse] Extracted company:", company);
    
    // Company LinkedIn URL - check all possible locations
    const companyLinkedInUrl = 
      contact.company?.social?.linkedin ||
      contact.company?.linkedinUrl || 
      contact.company?.linkedin_url ||
      contact.company?.linkedInUrl ||
      currentPos?.company?.linkedinUrl || 
      currentPos?.company?.linkedin_url || 
      history?.[0]?.company?.linkedinUrl || 
      history?.[0]?.company?.linkedin_url || 
      null;
    console.log("🔍 [parseLushaResponse] Extracted companyLinkedInUrl:", companyLinkedInUrl);
    
    // Job title/designation - check jobTitle object first, then nested
    const title = 
      contact.jobTitle?.title || 
      contact.job_title?.title ||
      currentPos?.title || 
      history?.[0]?.title || 
      contact.title ||
      null;
    console.log("🔍 [parseLushaResponse] Extracted title:", title);
    
    const city = contact.location?.city || contact.city || null;
    console.log("🔍 [parseLushaResponse] Extracted city:", city);

    const hasData = !!(phone || email);

    const result = {
      success: hasData,
      phone: phone || undefined,
      phone2: phone2 || undefined,
      phone3: phone3 || undefined,
      phone4: phone4 || undefined,
      email: email || undefined,
      fullName: fullName || undefined,
      company: company || undefined,
      companyLinkedInUrl: companyLinkedInUrl || undefined,
      title: title || undefined,
      city: city || undefined,
      message: hasData ? "Successfully retrieved contact information from Lusha" : "No contact data available",
      rawData: contact,
    };

    console.log("🔍 [parseLushaResponse] Final result:", result);
    return result;
  } catch (err: any) {
    console.error(`❌ Error parsing Lusha response:`, err.message);
    return {
      success: false,
      error: "Parse error",
      message: "Failed to parse API response",
    };
  }
}

/**
 * Smart Rotation: Try each key until one works (Python-style infinite retry)
 * RE-FETCHES keys from database on EVERY iteration (not just once at the start)
 * 
 * PYTHON LOGIC MIRRORED:
 * 1. Fetch all active keys for category
 * 2. Loop through keys
 * 3. Try API call with current key
 * 4. If 429/401: Mark dead, continue to next key
 * 5. If 200: Parse and return
 * 6. If 404: Return not found (don't retry)
 * 7. Otherwise: Continue to next key
 */
async function enrichWithSmartRotation(
  params: {
    linkedinUrl?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  },
  category: LushaCategory
): Promise<LushaEnrichResult> {
  console.log(`\n🚀 Starting enrichment with ${category} pool...`);

  const MAX_ATTEMPTS = 3; // ✅ REDUCED: Only try 3 times max (not 50)
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    // Fetch keys on each iteration
    console.log(`\n🔎 [Attempt ${attempt}/${MAX_ATTEMPTS}] Fetching active ${category} keys...`);
    const keys = await getActiveKeysForCategory(category);

    if (keys.length === 0) {
      console.error(`❌ No active ${category} keys available`);
      return {
        success: false,
        error: "No API keys",
        message: `All ${category} keys are exhausted or invalid. Please add more API keys in Admin Panel.`,
      };
    }

    // Get the FIRST key from the fresh list (least recently used)
    const key = keys[0];
    const keyEndsWith = key.key_value.slice(-4);

    console.log(`🔑 [${attempt}/${MAX_ATTEMPTS}] Trying key ending in ...${keyEndsWith}`);

    try {
      // Make API call to Lusha
      const response = await makeLushaApiCall(key.key_value, params);

      console.log(`📡 Response Status: ${response.status}`);
      
      // Extract credits from response (returned by proxy)
      const creditsRemaining = (response as any).creditsRemaining;
      const keyUsedSuffix = (response as any).keyUsed || `...${keyEndsWith}`;
      
      console.log(`💰 Credits remaining for key ...${keyEndsWith}: ${creditsRemaining}`);
      
      // Update credits in database if available
      if (creditsRemaining !== null && creditsRemaining !== undefined) {
        console.log(`📝 Updating key credits in database to: ${creditsRemaining}`);
        const { error: updateError } = await supabase
          .from("lusha_api_keys")
          .update({ 
            credits_remaining: creditsRemaining,
            last_used_at: new Date().toISOString()
          })
          .eq("id", key.id);
        
        if (updateError) {
          console.error(`❌ Error updating credits:`, updateError);
        }
        
        // Only mark as exhausted when credits actually reach 0
        if (creditsRemaining === 0) {
          console.log(`⚠️ Key ...${keyEndsWith} has 0 credits, marking as EXHAUSTED`);
          await markKeyAsDead(key.id, "EXHAUSTED");
        }
      }

      // Handle 200: SUCCESS!
      if (response.status === 200) {
        console.log(`✅ Success! Got data from Lusha API (HTTP 200)`);

        // Parse the response
        const result = parseLushaResponse(response.data);

        if (result.success || result.phone || result.email) {
          console.log(`✅ Successfully extracted contact data with key (...${keyEndsWith})`);

          // Update last_used_at timestamp
          await updateKeyLastUsed(key.id);

          // Add credits info to result
          result.creditsRemaining = creditsRemaining;
          result.keyUsed = keyUsedSuffix;

          return result;
        } else {
          console.log(`⚠️ Got 200 response but no contact data extracted`);
          return {
            success: false,
            error: "No data found",
            message: "Profile not found in Lusha database",
            creditsRemaining: creditsRemaining,
            keyUsed: keyUsedSuffix,
          };
        }
      }

      // Handle 401: Invalid Key - Mark as INVALID and retry with next key
      if (response.status === 401) {
        console.warn(`⛔ Key (...${keyEndsWith}) is INVALID/EXPIRED (HTTP 401)`);
        await markKeyAsDead(key.id, "INVALID");
        console.log(`🔄 Marked as INVALID. Trying next key...`);
        continue; // Try next key
      }

      // Handle 429: Out of Credits (rate limit) - Mark as EXHAUSTED and retry with next key
      if (response.status === 429) {
        console.warn(`⛔ Key (...${keyEndsWith}) is OUT OF CREDITS (HTTP 429)`);
        await markKeyAsDead(key.id, "EXHAUSTED");
        console.log(`🔄 Marked as EXHAUSTED. Trying next key...`);
        continue; // Try next key
      }

      // Handle 402: Payment Required (Lusha out of credit) - Mark as EXHAUSTED and retry with next key
      if (response.status === 402) {
        console.warn(`⛔ Key (...${keyEndsWith}) is OUT OF CREDITS (HTTP 402 - Payment Required)`);
        await markKeyAsDead(key.id, "EXHAUSTED");
        console.log(`🔄 Marked as EXHAUSTED. Trying next key...`);
        continue; // Try next key
      }

      // Handle 404: Not Found (Valid response, just no match in database)
      if (response.status === 404) {
        console.log(`❌ Profile not found in Lusha database (HTTP 404)`);
        return {
          success: false,
          error: "Not found",
          message: "Profile does not exist in Lusha database",
        };
      }

      // Handle other errors - show the real error
      console.error(`❌ API Error: HTTP ${response.status}`);
      console.error(`📋 Error Details:`, response.data);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        message: response.data?.message || response.error || `API returned status ${response.status}`,
        rawData: response.data,
      };

    } catch (err: any) {
      console.error(`❌ Network/System Error:`, err.message);
      return {
        success: false,
        error: "Network Error",
        message: err.message,
      };
    }
  }

  // Reached max attempts
  console.error(`❌ Reached maximum ${MAX_ATTEMPTS} attempts.`);
  return {
    success: false,
    error: "Max attempts reached",
    message: `Tried ${MAX_ATTEMPTS} times but all keys failed. Check console logs for details.`,
  };
}

/**
 * Enrich a prospect using Lusha API (LinkedIn URL method)
 * Uses smart key rotation to try multiple keys
 * HARD FIX: Direct HTTP calls to Lusha API
 */
export async function enrichProspect(
  linkedinUrl: string,
  category: LushaCategory
): Promise<LushaEnrichResult> {
  console.log(`\n📞 Starting LinkedIn URL enrichment (${category})`);
  console.log(`🔗 URL: ${linkedinUrl}`);

  return enrichWithSmartRotation(
    {
      linkedinUrl,
    },
    category
  );
}

/**
 * Enrich a prospect using Lusha API (Name + Company method)
 * Uses smart key rotation to try multiple keys
 * 
 * NOTE: firstName and lastName should be pre-split by the caller (Rtne.tsx)
 * This ensures consistent name splitting logic across the app
 */
export async function enrichProspectByName(
  firstName: string,
  lastName: string,
  companyName: string,
  category: LushaCategory
): Promise<LushaEnrichResult> {
  console.log(`\n👤 Starting Name+Company enrichment (${category})`);
  console.log(`📋 Name: ${firstName} ${lastName}`);
  console.log(`🏢 Company: ${companyName}`);

  return enrichWithSmartRotation(
    {
      firstName,
      lastName,
      companyName,
    },
    category
  );
}

/**
 * Get key statistics by category
 */
export async function getLushaKeyStats(category?: LushaCategory): Promise<{
  total: number;
  active: number;
  exhausted: number;
  invalid: number;
  suspended: number;
  totalCredits: number;
}> {
  let query = supabase.from("lusha_api_keys").select("*");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching key stats:", error);
    return { total: 0, active: 0, exhausted: 0, invalid: 0, suspended: 0, totalCredits: 0 };
  }

  const stats = {
    total: data.length,
    active: data.filter((k) => k.status === "ACTIVE" && k.is_active).length,
    exhausted: data.filter((k) => k.status === "EXHAUSTED").length,
    invalid: data.filter((k) => k.status === "INVALID").length,
    suspended: data.filter((k) => k.status === "SUSPENDED").length,
    totalCredits: data.reduce((sum, k) => sum + (k.credits_remaining || 0), 0),
  };

  return stats;
}
