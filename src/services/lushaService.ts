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
 * Enrich a prospect using Lusha API (LinkedIn URL method)
 */
export async function enrichProspect(
  linkedinUrl: string,
  category: LushaCategory,
  masterProspectId?: string
): Promise<LushaEnrichResult> {
  try {
    const { data, error } = await supabase.functions.invoke("lusha-enrich", {
      body: {
        linkedinUrl,
        category,
        masterProspectId,
      },
    });

    if (error) {
      console.error("Error calling lusha-enrich function:", error);
      return {
        success: false,
        error: "Function error",
        message: error.message,
      };
    }

    return data as LushaEnrichResult;
  } catch (err: any) {
    console.error("Error enriching prospect:", err);
    return {
      success: false,
      error: "Network error",
      message: err.message,
    };
  }
}

/**
 * Enrich a prospect using Lusha API (Name + Company method)
 */
export async function enrichProspectByName(
  fullName: string,
  companyName: string,
  category: LushaCategory,
  masterProspectId?: string
): Promise<LushaEnrichResult> {
  try {
    const { firstName, lastName } = splitFullName(fullName);
    
    const { data, error } = await supabase.functions.invoke("lusha-enrich", {
      body: {
        firstName,
        lastName,
        companyName,
        category,
        masterProspectId,
      },
    });

    if (error) {
      console.error("Error calling lusha-enrich function:", error);
      return {
        success: false,
        error: "Function error",
        message: error.message,
      };
    }

    return data as LushaEnrichResult;
  } catch (err: any) {
    console.error("Error enriching prospect by name:", err);
    return {
      success: false,
      error: "Network error",
      message: err.message,
    };
  }
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
