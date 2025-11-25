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
  email?: string | null;
  fullName?: string | null;
  company?: string | null;
  title?: string | null;
  error?: string;
  message?: string;
  rawData?: any;
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
 */
async function getActiveKeysForCategory(category: LushaCategory): Promise<LushaApiKey[]> {
  const { data, error } = await supabase
    .from("lusha_api_keys")
    .select("*")
    .eq("category", category)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`❌ Error fetching ${category} keys:`, error);
    return [];
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
 * This avoids CORS issues and provides server-side control
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
  try {
    console.log(`📡 Calling Lusha API via Supabase Edge Function...`);
    console.log(`🔑 Using API key ending in ...${apiKey.slice(-4)}`);
    console.log(`📋 Parameters:`, params);

    // Call Supabase Edge Function which will make the actual API call
    const { data, error } = await supabase.functions.invoke("lusha-enrich-proxy", {
      body: {
        apiKey: apiKey,
        params: params,
      },
    });

    if (error) {
      console.error(`❌ Edge Function Error:`, error);
      return {
        status: 0,
        data: null,
        error: error.message,
      };
    }

    console.log(`📊 Response Status: ${data?.status}`);
    console.log(`📊 Response Data:`, data?.data);

    return {
      status: data?.status || 0,
      data: data?.data,
      error: data?.error,
    };
  } catch (err: any) {
    console.error(`❌ Network Error:`, err.message);
    return {
      status: 0,
      data: null,
      error: err.message,
    };
  }
}

/**
 * Parse Lusha API response and extract contact data
 */
function parseLushaResponse(data: any): LushaEnrichResult {
  try {
    // Lusha returns contact data in different formats
    const contact = data?.contact?.data || data?.data || data;

    if (!contact) {
      return {
        success: false,
        error: "No contact data",
        message: "No contact information found in response",
      };
    }

    // Extract phone numbers
    let phone: string | null = null;
    const phones = contact.phoneNumbers || [];
    if (phones.length > 0) {
      phone = phones[0].internationalNumber || phones[0].number || null;
    }

    // Extract email addresses
    let email: string | null = null;
    const emails = contact.emailAddresses || [];
    if (emails.length > 0) {
      email = emails[0].email || null;
    }

    // Extract other fields
    const fullName = contact.fullName || null;
    const company = contact.company?.name || null;
    const title = contact.jobTitle || null;

    return {
      success: !!(phone || email), // Success if we got at least one field
      phone: phone || undefined,
      email: email || undefined,
      fullName: fullName || undefined,
      company: company || undefined,
      title: title || undefined,
      rawData: contact,
    };
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
 * Smart Rotation: Try each key until one works
 * HARD FIX: Direct HTTP calls to Lusha API
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
  // Step 1: Fetch ALL active keys for this category (FRESH fetch every time)
  console.log(`\n🔎 Fetching active ${category} keys from database...`);
  const keys = await getActiveKeysForCategory(category);

  if (keys.length === 0) {
    console.error(`❌ No active ${category} keys available`);
    return {
      success: false,
      error: "No API keys",
      message: `All ${category} keys are exhausted or invalid`,
    };
  }

  console.log(`✅ Found ${keys.length} active ${category} keys`);
  console.log(`🔎 Starting enrichment loop...`);

  // Step 2: Loop through each key
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const keyEndsWith = key.key_value.slice(-4);

    console.log(`\n🔑 [${i + 1}/${keys.length}] Attempting with key ending in ...${keyEndsWith}`);

    try {
      // Step 3: Make API call via Supabase Edge Function
      const response = await makeLushaApiCall(key.key_value, params);

      // Step 4: Handle different HTTP status codes
      if (response.status === 429) {
        // Rate Limited (Out of Credits)
        console.warn(`⛔ Key (...${keyEndsWith}) is OUT OF CREDITS (Status 429)`);
        await markKeyAsDead(key.id, "EXHAUSTED");
        console.log(`🔄 Marked as EXHAUSTED. Trying next key...`);
        continue; // IMMEDIATELY loop to next key
      }

      if (response.status === 401) {
        // Unauthorized (Invalid Key)
        console.warn(`⛔ Key (...${keyEndsWith}) is INVALID/EXPIRED (Status 401)`);
        await markKeyAsDead(key.id, "INVALID");
        console.log(`🔄 Marked as INVALID. Trying next key...`);
        continue; // IMMEDIATELY loop to next key
      }

      if (response.status === 404) {
        // Not Found (Valid response, no match)
        console.log(`❌ Profile not found in Lusha database (Status 404)`);
        return {
          success: false,
          error: "Not found",
          message: "Profile does not exist in Lusha database",
        };
      }

      if (response.status === 200) {
        // SUCCESS!
        console.log(`✅ Success! Got response from Lusha API (Status 200)`);
        
        // Parse the response
        const result = parseLushaResponse(response.data);
        
        if (result.success || result.phone || result.email) {
          console.log(`✅ Successfully extracted data with key (...${keyEndsWith})`);
          await updateKeyLastUsed(key.id);
          return result;
        } else {
          console.log(`⚠️ Got 200 response but no data extracted. Trying next key...`);
          continue;
        }
      }

      // Other status codes
      console.warn(`⚠️ Key (...${keyEndsWith}) returned status ${response.status}. Trying next key...`);
      continue;
    } catch (err: any) {
      console.error(`❌ Error with Key (...${keyEndsWith}):`, err.message);
      continue; // Try next key
    }
  }

  // Step 5: All keys failed
  console.error(`❌ All ${keys.length} ${category} keys have been tried and failed`);
  return {
    success: false,
    error: "All keys exhausted",
    message: `All ${keys.length} ${category} keys are exhausted or invalid. Please add more API keys.`,
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
 * HARD FIX: Direct HTTP calls to Lusha API
 */
export async function enrichProspectByName(
  fullName: string,
  companyName: string,
  category: LushaCategory
): Promise<LushaEnrichResult> {
  const { firstName, lastName } = splitFullName(fullName);

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
