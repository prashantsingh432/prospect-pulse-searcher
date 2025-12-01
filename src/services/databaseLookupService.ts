import { supabase } from "@/integrations/supabase/client";

export interface DatabaseLookupResult {
  found: boolean;
  data?: {
    full_name?: string | null;
    company_name?: string | null;
    prospect_designation?: string | null;
    prospect_city?: string | null;
    prospect_number?: string | null;
    prospect_number2?: string | null;
    prospect_number3?: string | null;
    prospect_number4?: string | null;
    prospect_email?: string | null;
  };
}

/**
 * Search master_prospects table by LinkedIn URL
 * Returns existing prospect data if found
 */
export async function lookupProspectInDatabase(
  linkedinUrl: string
): Promise<DatabaseLookupResult> {
  try {
    console.log("🔍 Searching database for:", linkedinUrl);

    // Normalize the LinkedIn URL to canonical format
    const canonicalUrl = normalizeLinkedInUrl(linkedinUrl);
    console.log("🔗 Canonical URL:", canonicalUrl);

    // Search by canonical_url
    const { data, error } = await supabase
      .from("master_prospects")
      .select("*")
      .eq("canonical_url", canonicalUrl)
      .maybeSingle();

    if (error) {
      console.error("❌ Database lookup error:", error);
      return { found: false };
    }

    if (!data) {
      console.log("❌ No existing data found in database");
      return { found: false };
    }

    console.log("✅ Found existing prospect in database:", data);

    return {
      found: true,
      data: {
        full_name: data.full_name,
        company_name: data.company_name,
        prospect_designation: data.prospect_designation,
        prospect_city: data.prospect_city,
        prospect_number: data.prospect_number,
        prospect_number2: data.prospect_number2,
        prospect_number3: data.prospect_number3,
        prospect_number4: data.prospect_number4,
        prospect_email: data.prospect_email,
      },
    };
  } catch (error) {
    console.error("❌ Database lookup exception:", error);
    return { found: false };
  }
}

/**
 * Normalize LinkedIn URL to canonical format
 * Extracts the username and creates a standard format
 */
function normalizeLinkedInUrl(url: string): string {
  try {
    // Remove whitespace
    url = url.trim();

    // Handle various LinkedIn URL formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\/\?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([^\/\?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const username = match[1].toLowerCase();
        return `https://www.linkedin.com/in/${username}`;
      }
    }

    // If already in canonical format
    if (url.startsWith("https://www.linkedin.com/in/")) {
      return url.toLowerCase();
    }

    // Default: assume it's just the username
    const username = url.replace(/^@/, "").toLowerCase();
    return `https://www.linkedin.com/in/${username}`;
  } catch (error) {
    console.error("Error normalizing LinkedIn URL:", error);
    return url;
  }
}
