
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Prospect } from "@/data/prospects";
import { testSupabaseConnection, type ConnectionTestResult } from "@/services/connectionService";
import { searchProspects, type SearchParams } from "@/services/prospectSearchService";
import { validateProspectSearch } from "@/utils/validationUtils";
import { formatProspectsForClipboard } from "@/utils/clipboardUtils";
import { supabase } from "@/integrations/supabase/client";

export const useProspectSearch = () => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("prospect-info");
  const [prospectName, setProspectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Test Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Testing Supabase connection on load...");
        const result = await testSupabaseConnection();
        
        setConnectionStatus(result);
        setDebugInfo(prev => ({ ...prev, connectionTest: result }));
        
        if (result.success) {
          // Update total records count
          const { data, error } = await supabase
            .from("prospects")
            .select("full_name", { count: "exact" });
            
          if (!error) {
            setTotalRecords(data?.length || 0);
          }
        }
      } catch (err) {
        console.error("Connection check error:", err);
        setConnectionStatus({
          success: false,
          message: err instanceof Error ? err.message : "Unknown error checking connection",
          lastChecked: new Date(),
          error: err,
          connected: false
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
    setPhoneNumber("");
    setLinkedinUrl("");
    setValidationError("");
  }, [activeTab]);

  // Validate search form based on the active tab
  const validateSearch = useCallback(() => {
    const validation = validateProspectSearch(activeTab, prospectName, companyName, linkedinUrl);
    setValidationError(validation.errorMessage);
    return validation.isValid;
  }, [activeTab, prospectName, companyName, linkedinUrl]);

  // Manually test connection - useful for debugging
  const testConnection = useCallback(async () => {
    try {
      setIsSearching(true);
      const result = await testSupabaseConnection();
      
      setConnectionStatus(result);
      setDebugInfo(prev => ({ ...prev, connectionTest: result }));
      
      if (result.success) {
        // Update total records count
        const { data, error } = await supabase
          .from("prospects")
          .select("full_name", { count: "exact" });
          
        if (!error) {
          setTotalRecords(data?.length || 0);
        }
      }
      
      toast({
        title: result.success ? "Database connected" : "Database connection failed",
        description: result.message || (result.success ? "Successfully connected to database" : "Could not connect to database"),
        variant: result.success ? "default" : "destructive",
      });
    } catch (err) {
      console.error("Manual connection test error:", err);
      setConnectionStatus({
        success: false,
        message: err instanceof Error ? err.message : "Unknown error checking connection",
        lastChecked: new Date(),
        error: err,
        connected: false
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

  // Handle search using the prospectSearchService
  const handleSearch = useCallback(async () => {
    // Clear previous search results immediately when search is initiated
    setSearchResults([]);
    setHasSearched(true);
    setDebugInfo(null);
    
    // Validate search form
    if (!validateSearch()) {
      toast({
        title: "Required fields missing",
        description: validationError || "Please check the search requirements.",
        variant: "destructive",
      });
      // We still set isSearching to false but keep hasSearched true and searchResults empty
      return;
    }

    setIsSearching(true);
    
    try {
      // Prepare search parameters
      const searchParams: SearchParams = {
        activeTab,
        prospectName,
        companyName,
        location,
        phoneNumber,
        linkedinUrl
      };
      
      // Execute the search
      const searchResult = await searchProspects(searchParams);
      
      // Update state with results
      setSearchResults(searchResult.results);
      setDebugInfo(searchResult.debugInfo);
      
      // Show toast with results
      toast({
        title: "Search complete",
        description: searchResult.message || 
          (searchResult.results.length > 0 
            ? `Found ${searchResult.results.length} matching prospects.`
            : "No matching prospects found."),
        variant: searchResult.success ? "default" : "destructive",
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
  }, [
    activeTab, 
    prospectName, 
    companyName, 
    location, 
    phoneNumber,
    linkedinUrl, 
    toast, 
    validateSearch, 
    validationError
  ]);

  // Copy all search results to clipboard
  const copyAllResults = useCallback(() => {
    if (searchResults.length === 0) {
      toast({
        title: "Nothing to copy",
        description: "No search results available.",
        variant: "destructive",
      });
      return;
    }
    
    const text = formatProspectsForClipboard(searchResults);
    
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
    phoneNumber,
    setPhoneNumber,
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
