import { supabase } from "@/integrations/supabase/client";

export interface ConnectionTestResult {
  success: boolean;
  error?: any;
  message?: string;
  data?: any;
  lastChecked: Date;
  connected: boolean; 
  recordCount?: number;
}

/**
 * Tests the connection to Supabase
 * @returns A promise that resolves to a ConnectionTestResult
 */
export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  try {
    console.log("Testing Supabase connection...");
    
    // First test if we can access the database at all with a simple query
    const { data: testData, error: testError } = await supabase
      .from("prospects")
      .select("id, full_name, company_name")
      .limit(5);
    
    if (testError) {
      console.error("Supabase connection test failed:", testError);
      
      // Check if it's a column not found error
      if (testError.message?.includes('column') && testError.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: testError,
          message: `Database schema issue: ${testError.message}. Please ensure the prospects table has the correct schema.`,
          lastChecked: new Date(),
          connected: false
        };
      }
      
      return { 
        success: false, 
        error: testError,
        message: `Connection test failed: ${testError.message}`,
        lastChecked: new Date(),
        connected: false
      };
    }
    
    // Get the total count of records
    const { count, error: countError } = await supabase
      .from("prospects")
      .select("*", { count: "exact", head: true });
      
    if (countError) {
      console.error("Error getting record count:", countError);
    }
    
    console.log("Supabase connection successful, test data:", testData);
    return { 
      success: true, 
      data: testData,
      message: `Connected successfully. Found ${testData?.length || 0} test records. Total database records: ${count || 'unknown'}.`,
      lastChecked: new Date(),
      connected: true,
      recordCount: count || 0
    };
  } catch (err) {
    console.error("Connection test failed with exception:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error("Unknown connection error"),
      message: `Exception during connection test: ${err instanceof Error ? err.message : "Unknown error"}`,
      lastChecked: new Date(),
      connected: false
    };
  }
};