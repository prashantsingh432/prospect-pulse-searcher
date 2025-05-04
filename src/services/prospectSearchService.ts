
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
      const results = queryResults.map(record => ({
        id: record.id,
        name: record.full_name,
        company: record.company_name,
        location: record.prospect_city || "",
        phone: record.prospect_number || "",
        email: record.prospect_email || "",
        linkedin: record.prospect_linkedin || ""
      })) as Prospect[];
      
      const debugInfo = {
        query: params,
        results: queryResults,
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
          normalizedUrl: normalizeLinkedInUrl(linkedinUrl),
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
  
  const normalizedLinkedInUrl = normalizeLinkedInUrl(linkedinUrl.trim());
  console.log("Normalized URL for search:", normalizedLinkedInUrl);
  
  // Try multiple search strategies for better matches
  const searchPromises = [];
  
  // Strategy 1: Direct match on normalized URL (most precise)
  searchPromises.push(
    supabase
      .from("prospects")
      .select("*")
      .filter("prospect_linkedin", "ilike", `%${normalizedLinkedInUrl}%`)
  );
  
  // Strategy 2: Try to match just the username portion
  const username = extractLinkedInUsername(linkedinUrl);
  if (username) {
    console.log("Extracted username for search:", username);
    searchPromises.push(
      supabase
        .from("prospects")
        .select("*")
        .filter("prospect_linkedin", "ilike", `%${username}%`)
    );
  }
  
  // Execute all search strategies in parallel
  const searchResults = await Promise.all(searchPromises);
  console.log("Multiple search strategies results:", searchResults);
  
  // Combine and deduplicate results
  const allResults = searchResults
    .filter(result => !result.error && result.data)
    .flatMap(result => result.data || []);
    
  // Remove duplicates by ID
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.id, item])).values()
  );
  
  console.log("LinkedIn search results:", uniqueResults);
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
  
  // Add filters based on provided inputs
  if (prospectName.trim()) {
    query = query.ilike("full_name", `%${prospectName.trim()}%`);
    console.log("Added name filter:", prospectName);
  }
  
  if (companyName.trim()) {
    // If we already have a name filter, we need to use the or filter for company
    if (prospectName.trim()) {
      // We need to remove the previous ilike filter and use a combined or filter
      query = supabase.from("prospects").select("*");
      
      // Combined filter for name OR company
      query = query.or(`full_name.ilike.%${prospectName.trim()}%,company_name.ilike.%${companyName.trim()}%`);
      console.log("Added combined name+company filter");
    } else {
      // Only company filter
      query = query.ilike("company_name", `%${companyName.trim()}%`);
      console.log("Added company filter:", companyName);
    }
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
  
  console.log("Search results:", data);
  return data || [];
}
