
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/data/prospects";
import { normalizeLinkedInUrl, extractLinkedInUsername } from "@/utils/linkedInUtils";
import { testSupabaseConnection } from "./connectionService";

export interface SearchParams {
  activeTab: string;
  prospectName: string;
  companyName: string;
  location: string;
  linkedinUrl: string;
}

export interface SearchResult {
  results: Prospect[];
  debugInfo: any;
  success: boolean;
  message?: string;
  error?: any;
}

/**
 * Search for prospects based on the provided parameters
 */
export const searchProspects = async (params: SearchParams): Promise<SearchResult> => {
  const { activeTab, prospectName, companyName, location, linkedinUrl } = params;
  
  try {
    console.log("Starting search with parameters:", params);
    
    // Test connection first to make sure we can access the database
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.message}`);
    }
    
    // Different query logic based on active tab
    let queryResults;
    
    if (activeTab === "linkedin-url") {
      // Search by LinkedIn URL
      queryResults = await searchByLinkedInUrl(linkedinUrl);
    } else {
      // Search by prospect info
      queryResults = await searchByProspectInfo(prospectName, companyName, location);
    }
    
    // Process and map the results to the Prospect model
    if (queryResults && queryResults.length > 0) {
      const results = queryResults.map((record, index) => ({
        name: record.full_name,
        company: record.company_name,
        location: record.prospect_city || "",
        phone: record.prospect_number || "",
        phone2: record.prospect_number2 || "",
        phone3: record.prospect_number3 || "",
        phone4: record.prospect_number4 || "",
        email: record.prospect_email || "",
        linkedin: record.prospect_linkedin || ""
      })) as Prospect[];
      
      const debugInfo = {
        query: params,
        results: queryResults.length,
        timestamp: new Date()
      };
      
      return {
        results,
        debugInfo,
        success: true,
        message: `Found ${results.length} matching prospects.`
      };
    } else {
      return {
        results: [],
        debugInfo: {
          query: params,
          normalizedUrl: activeTab === "linkedin-url" ? normalizeLinkedInUrl(linkedinUrl) : null,
          timestamp: new Date()
        },
        success: true,
        message: "No matching prospects found."
      };
    }
  } catch (error) {
    console.error("Search error:", error);
    
    return {
      results: [],
      debugInfo: { error, query: params },
      success: false,
      error,
      message: error instanceof Error 
        ? `Error: ${error.message}` 
        : "An error occurred while searching."
    };
  }
};

/**
 * Search for prospects by LinkedIn URL
 */
async function searchByLinkedInUrl(linkedinUrl: string): Promise<any[]> {
  console.log("Searching by LinkedIn URL:", linkedinUrl);
  
  if (!linkedinUrl.trim()) {
    return [];
  }
  
  const normalizedLinkedInUrl = normalizeLinkedInUrl(linkedinUrl.trim());
  console.log("Normalized URL for search:", normalizedLinkedInUrl);
  
  // Try multiple search strategies for better matches
  const searchPromises = [];
  
  // Strategy 1: Direct match on normalized URL (most precise)
  searchPromises.push(
    supabase
      .from("prospects")
      .select("*")
      .ilike("prospect_linkedin", `%${normalizedLinkedInUrl}%`)
  );
  
  // Strategy 2: Try to match just the username portion
  const username = extractLinkedInUsername(linkedinUrl);
  if (username) {
    console.log("Extracted username for search:", username);
    searchPromises.push(
      supabase
        .from("prospects")
        .select("*")
        .ilike("prospect_linkedin", `%${username}%`)
    );
  }
  
  // Execute all search strategies in parallel
  const searchResults = await Promise.all(searchPromises);
  console.log("Multiple search strategies results:", searchResults.map(r => r.data?.length || 0));
  
  // Combine and deduplicate results
  const allResults = searchResults
    .filter(result => !result.error && result.data)
    .flatMap(result => result.data || []);
    
  // Remove duplicates by name + company combination (since we don't have id)
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [`${item.full_name}-${item.company_name}`, item])).values()
  );
  
  console.log(`LinkedIn search found ${uniqueResults.length} results`);
  return uniqueResults;
}

/**
 * Search for prospects by name and/or company with optional location
 */
async function searchByProspectInfo(
  prospectName: string, 
  companyName: string, 
  location: string
): Promise<any[]> {
  console.log("Searching by Prospect and/or Company Name with Location filter");
  
  // Start with the base query
  let query = supabase.from("prospects").select("*");
  
  // Add filters based on provided inputs (AND logic)
  if (prospectName.trim()) {
    query = query.ilike("full_name", `%${prospectName.trim()}%`);
    console.log("Added name filter:", prospectName);
  }
  
  if (companyName.trim()) {
    query = query.ilike("company_name", `%${companyName.trim()}%`);
    console.log("Added company filter:", companyName);
  }
  
  // Add location filter if provided - this is always an AND condition
  if (location.trim()) {
    query = query.ilike("prospect_city", `%${location.trim()}%`);
    console.log("Added location filter:", location);
  }
  
  console.log("Executing search query...");
  const { data, error } = await query;
  
  if (error) {
    console.error("Search error:", error);
    throw error;
  }
  
  console.log(`Search found ${data?.length || 0} results`);
  return data || [];
}
