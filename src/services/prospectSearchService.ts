
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/data/prospects";

export interface SearchParams {
  activeTab: string;
  prospectName: string;
  companyName: string;
  location: string;
  linkedinUrl: string;
}

export interface SearchResult {
  success: boolean;
  results: Prospect[];
  message?: string;
  debugInfo?: any;
}

export const searchProspects = async (params: SearchParams): Promise<SearchResult> => {
  try {
    console.log("Search params:", params);
    
    let query = supabase.from("prospects").select("*");
    
    // Build the query based on search parameters
    if (params.activeTab === "prospect-info") {
      if (params.prospectName) {
        query = query.ilike("full_name", `%${params.prospectName}%`);
      }
      if (params.companyName) {
        query = query.ilike("company_name", `%${params.companyName}%`);
      }
      if (params.location) {
        query = query.ilike("prospect_city", `%${params.location}%`);
      }
    } else if (params.activeTab === "linkedin-search") {
      if (params.linkedinUrl) {
        query = query.ilike("prospect_linkedin", `%${params.linkedinUrl}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Search error:", error);
      return {
        success: false,
        results: [],
        message: `Search failed: ${error.message}`,
        debugInfo: { error, params }
      };
    }
    
    console.log("Raw search results:", data);
    
    // Map database results to frontend model
    const mappedResults: Prospect[] = (data || []).map(record => ({
      name: record.full_name,
      company: record.company_name,
      designation: record.prospect_designation,
      location: record.prospect_city || "",
      phone: record.prospect_number || "",
      phone2: record.prospect_number2 || "",
      phone3: record.prospect_number3 || "",
      phone4: record.prospect_number4 || "",
      email: record.prospect_email || "",
      linkedin: record.prospect_linkedin || ""
    }));
    
    console.log("Mapped search results:", mappedResults);
    
    return {
      success: true,
      results: mappedResults,
      message: `Found ${mappedResults.length} matching prospects`,
      debugInfo: { 
        rawData: data, 
        mappedResults, 
        params,
        query: query 
      }
    };
    
  } catch (error) {
    console.error("Unexpected search error:", error);
    return {
      success: false,
      results: [],
      message: "An unexpected error occurred during search",
      debugInfo: { error, params }
    };
  }
};
