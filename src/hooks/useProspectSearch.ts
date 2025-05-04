
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Prospect } from "@/data/prospects";
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client";

// Helper function to normalize LinkedIn URLs for more reliable searching
const normalizeLinkedInUrl = (url: string): string => {
  if (!url) return '';
  
  let normalizedUrl = url.trim().toLowerCase();
  
  // Remove protocol if present
  normalizedUrl = normalizedUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');
    
  // Remove trailing slash if present
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');
  
  console.log(`Normalized LinkedIn URL: "${url}" → "${normalizedUrl}"`);
  return normalizedUrl;
};

export const useProspectSearch = () => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("prospect-info");
  const [prospectName, setProspectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    lastChecked: Date | null;
  } | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Test Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Testing Supabase connection on load...");
        const result = await testSupabaseConnection();
        
        if (!result.success) {
          console.error("Connection test failed:", result.error);
          setConnectionStatus({
            connected: false,
            message: result.message || "Connection failed",
            lastChecked: new Date()
          });
          setDebugInfo(result);
        } else {
          console.log("Connection test succeeded:", result);
          setConnectionStatus({
            connected: true,
            message: result.message || "Connected successfully",
            lastChecked: new Date()
          });
          setDebugInfo(result);
        }
      } catch (err) {
        console.error("Connection check error:", err);
        setConnectionStatus({
          connected: false,
          message: err instanceof Error ? err.message : "Unknown error checking connection",
          lastChecked: new Date()
        });
        setDebugInfo({ error: err });
      }
    };
    
    checkConnection();
  }, []);

  // Reset form when switching tabs
  useEffect(() => {
    setProspectName("");
    setCompanyName("");
    setLocation("");
    setLinkedinUrl("");
    setValidationError("");
  }, [activeTab]);

  // Validate search form based on the active tab
  const validateSearch = useCallback(() => {
    if (activeTab === "prospect-info") {
      // For prospect info tab, require at least prospect name or company name
      if (!prospectName.trim() && !companyName.trim()) {
        setValidationError("At least one of Prospect Name or Company Name is required");
        return false;
      }
    } else if (activeTab === "linkedin-url") {
      // For LinkedIn tab, require the LinkedIn URL
      if (!linkedinUrl.trim()) {
        setValidationError("LinkedIn URL is required");
        return false;
      }
      
      // Simple validation for LinkedIn URL format - more permissive to catch variations
      const linkedinPattern = /linkedin\.com/i;
      if (!linkedinPattern.test(linkedinUrl.trim())) {
        setValidationError("Please enter a URL containing 'linkedin.com'");
        return false;
      }
    }
    
    setValidationError("");
    return true;
  }, [activeTab, prospectName, companyName, linkedinUrl]);

  // Manually test connection - useful for debugging
  const testConnection = useCallback(async () => {
    try {
      setIsSearching(true);
      const result = await testSupabaseConnection();
      
      if (!result.success) {
        console.error("Manual connection test failed:", result.error);
        setConnectionStatus({
          connected: false,
          message: result.message || "Connection failed",
          lastChecked: new Date()
        });
        setDebugInfo(result);
        
        toast({
          title: "Database connection failed",
          description: result.message || "Could not connect to database",
          variant: "destructive",
        });
      } else {
        console.log("Manual connection test succeeded:", result);
        setConnectionStatus({
          connected: true,
          message: result.message || "Connected successfully",
          lastChecked: new Date()
        });
        setDebugInfo(result);
        
        toast({
          title: "Database connected",
          description: result.message || "Successfully connected to database",
        });
      }
    } catch (err) {
      console.error("Manual connection test error:", err);
      setConnectionStatus({
        connected: false,
        message: err instanceof Error ? err.message : "Unknown error checking connection",
        lastChecked: new Date()
      });
      setDebugInfo({ error: err });
      
      toast({
        title: "Connection error",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const handleSearch = useCallback(async () => {
    // Validate search form
    if (!validateSearch()) {
      toast({
        title: "Required fields missing",
        description: validationError || "Please check the search requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setDebugInfo(null);
    
    try {
      console.log("Starting search with parameters:", {
        activeTab,
        prospectName,
        companyName,
        location,
        linkedinUrl
      });
      
      // Test connection first to make sure we can access the database
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        throw new Error(`Database connection failed: ${connectionTest.message}`);
      }
      
      // Different query logic based on active tab
      let queryResults;
      
      if (activeTab === "linkedin-url") {
        // Option B: Search by LinkedIn URL with improved normalization
        console.log("Searching by LinkedIn URL:", linkedinUrl);
        
        const normalizedLinkedInUrl = normalizeLinkedInUrl(linkedinUrl.trim());
        console.log("Normalized URL for search:", normalizedLinkedInUrl);
        
        // More permissive search for LinkedIn URL - search in prospect_linkedin column
        // Use wildcards for better partial matching
        let query = supabase.from("prospects").select("*");
        
        // Try multiple search strategies for better matches
        const searchPromises = [];
        
        // Strategy 1: Direct match on normalized URL (most precise)
        searchPromises.push(
          supabase
            .from("prospects")
            .select("*")
            .filter("prospect_linkedin", "ilike", `%${normalizedLinkedInUrl}%`)
        );
        
        // Strategy 2: Try to match just the username portion (e.g., "johndoe" part from linkedin.com/in/johndoe)
        const usernameMatch = normalizedLinkedInUrl.match(/linkedin\.com\/in\/([^\/]+)/i);
        if (usernameMatch && usernameMatch[1]) {
          const username = usernameMatch[1];
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
        queryResults = uniqueResults;
        
      } else {
        // Option A: Search by Prospect Name AND/OR Company Name, with optional Location
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
        queryResults = data;
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
        
        setSearchResults(results);
        
        toast({
          title: "Search complete",
          description: `Found ${results.length} matching prospects.`,
        });
      } else {
        setSearchResults([]);
        console.log("No matching prospects found");
        
        toast({
          title: "Search complete",
          description: "No matching prospects found.",
        });
      }
      
      // Save debug information for troubleshooting
      setDebugInfo({
        query: {
          activeTab,
          prospectName,
          companyName,
          location,
          linkedinUrl,
          normalizedUrl: normalizeLinkedInUrl(linkedinUrl)
        },
        results: queryResults,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setDebugInfo({ error });
      
      toast({
        title: "Search failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [activeTab, prospectName, companyName, location, linkedinUrl, toast, validateSearch, validationError]);

  const copyAllResults = useCallback(() => {
    if (searchResults.length === 0) {
      toast({
        title: "Nothing to copy",
        description: "No search results available.",
        variant: "destructive",
      });
      return;
    }
    
    const text = searchResults.map(prospect => 
      `Name: ${prospect.name}\nCompany: ${prospect.company}\nEmail: ${prospect.email}\nPhone: ${prospect.phone}\nLinkedIn: ${prospect.linkedin}\nLocation: ${prospect.location}\n\n`
    ).join('');
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${searchResults.length} prospect details copied.`,
      });
    }).catch((error) => {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
      console.error("Copy failed:", error);
    });
  }, [searchResults, toast]);

  return {
    activeTab,
    setActiveTab,
    prospectName,
    setProspectName,
    companyName,
    setCompanyName,
    location,
    setLocation,
    linkedinUrl,
    setLinkedinUrl,
    searchResults,
    hasSearched,
    isSearching,
    validationError,
    setValidationError,
    connectionStatus,
    totalRecords,
    handleSearch,
    copyAllResults,
    testConnection,
    debugInfo
  };
};
