
import { supabase } from "@/integrations/supabase/client";

export interface ConnectionTestResult {
  success: boolean;
  error?: any;
  message?: string;
  data?: any;
  lastChecked: Date;
}

/**
 * Tests the connection to Supabase
 * @returns A promise that resolves to a ConnectionTestResult
 */
export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  try {
    console.log("Testing Supabase connection...");
    
    // First test if we can access the database at all
    const { data: testData, error: testError } = await supabase
      .from("prospects")
      .select("*")
      .limit(1);
    
    if (testError) {
      console.error("Supabase connection test failed:", testError);
      return { 
        success: false, 
        error: testError,
        message: `Connection test failed: ${testError.message}`,
        lastChecked: new Date()
      };
    }
    
    console.log("Supabase connection successful, test data:", testData);
    return { 
      success: true, 
      data: testData,
      message: `Connected successfully. Found ${testData?.length || 0} test records.`,
      lastChecked: new Date()
    };
  } catch (err) {
    console.error("Connection test failed with exception:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error("Unknown connection error"),
      message: `Exception during connection test: ${err instanceof Error ? err.message : "Unknown error"}`,
      lastChecked: new Date()
    };
  }
};
