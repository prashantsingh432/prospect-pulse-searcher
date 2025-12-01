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
 * Search prospects table by LinkedIn URL
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

    // Extract username for flexible matching
    const username = extractLinkedInUsername(canonicalUrl);
    console.log("👤 Extracted username:", username);

    // Search in prospects table with flexible matching
    // First try exact match, then try ILIKE pattern match for different URL formats
    let data = null;
    let error = null;

    // Try exact match first
    const exactMatch = await supabase
      .from("prospects")
      .select("*")
      .eq("prospect_linkedin", canonicalUrl)
      .maybeSingle();

    if (exactMatch.data) {
      data = exactMatch.data;
    } else if (username) {
      // If no exact match, try pattern matching with username
      const patternMatch = await supabase
        .from("prospects")
        .select("*")
        .ilike("prospect_linkedin", `%${username}%`)
        .limit(1)
        .maybeSingle();
      
      if (patternMatch.data) {
        data = patternMatch.data;
        console.log("✅ Found via pattern match");
      }
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
 * Extract LinkedIn username from URL for flexible matching
 */
function extractLinkedInUsername(url: string): string | null {
  try {
    const patterns = [
      /linkedin\.com\/in\/([^\/\?]+)/i,
      /linkedin\.com\/pub\/([^\/\?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase().replace(/\/+$/, '');
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Normalize LinkedIn URL to canonical format
 * Extracts the username and creates a standard format
 */
function normalizeLinkedInUrl(url: string): string {
  try {
    // Remove whitespace and trailing slashes
    url = url.trim().replace(/\/+$/, '');

    // Handle various LinkedIn URL formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\/\?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([^\/\?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const username = match[1].toLowerCase().replace(/\/+$/, '');
        return `https://www.linkedin.com/in/${username}`;
      }
    }

    // If already in canonical format, clean and normalize
    if (url.toLowerCase().includes("linkedin.com/in/")) {
      const cleaned = url.toLowerCase().replace(/\/+$/, '');
      const parts = cleaned.split('/in/');
      if (parts.length > 1) {
        const username = parts[1].split(/[\/\?]/)[0];
        return `https://www.linkedin.com/in/${username}`;
      }
    }

    // Default: assume it's just the username
    const username = url.replace(/^@/, "").toLowerCase().replace(/\/+$/, '');
    return `https://www.linkedin.com/in/${username}`;
  } catch (error) {
    console.error("Error normalizing LinkedIn URL:", error);
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}
