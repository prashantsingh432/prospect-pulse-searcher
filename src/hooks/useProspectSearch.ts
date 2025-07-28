
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Prospect } from "@/data/prospects";
import { testSupabaseConnection, type ConnectionTestResult } from "@/services/connectionService";
import { searchProspects, type SearchParams, type SearchFilters } from "@/services/prospectSearchService";
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
  const [showFilterModal, setShowFilterModal] = useState(false);

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
    const validation = validateProspectSearch(activeTab, prospectName, companyName, linkedinUrl, location, phoneNumber);
    setValidationError(validation.errorMessage);
    return validation.isValid;
  }, [activeTab, prospectName, companyName, linkedinUrl, location, phoneNumber]);

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

  // Handle search with filters applied
  const handleSearchWithFilters = useCallback(async (filters: SearchFilters) => {
    // Clear previous search results immediately when search is initiated
    setSearchResults([]);
    setHasSearched(true);
    setDebugInfo(null);
    setIsSearching(true);
    
    try {
      // Prepare search parameters with filters
      const searchParams: SearchParams = {
        activeTab,
        prospectName,
        companyName,
        location,
        phoneNumber,
        linkedinUrl,
        filters
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
    toast
  ]);

  // Handle search triggered by Enter key - direct search without modal
  const handleDirectSearch = useCallback(async () => {
    // Validate search form first
    if (!validateSearch()) {
      toast({
        title: "Required fields missing",
        description: validationError || "Please check the search requirements.",
        variant: "destructive",
      });
      return;
    }

    // Perform direct search without filters
    await handleSearchWithFilters({
      emailOnly: false,
      phoneOnly: false,
      both: false,
    });
  }, [validateSearch, validationError, toast, handleSearchWithFilters]);

  // Handle search button click - conditional filter modal
  const handleSearchClick = useCallback(() => {
    // Validate search form first
    if (!validateSearch()) {
      toast({
        title: "Required fields missing",
        description: validationError || "Please check the search requirements.",
        variant: "destructive",
      });
      return;
    }

    // Only show filter modal for prospect-info tab with specific conditions
    if (activeTab === "prospect-info") {
      // Check if only phone number is provided (no modal needed)
      const hasOnlyPhoneNumber = phoneNumber.trim() && 
        !prospectName.trim() && 
        !companyName.trim() && 
        !location.trim();
      
      if (hasOnlyPhoneNumber) {
        // Direct search for phone-only queries
        handleDirectSearch();
        return;
      }
      
      // Check if at least one of Company Name, Prospect Name, or Location is used
      const hasRelevantFields = companyName.trim() || prospectName.trim() || location.trim();
      
      if (hasRelevantFields) {
        // Show filter modal for prospect info searches
        setShowFilterModal(true);
        return;
      }
    }
    
    // For LinkedIn URL or other cases, perform direct search
    handleDirectSearch();
  }, [validateSearch, validationError, toast, activeTab, phoneNumber, prospectName, companyName, location, handleDirectSearch]);

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
    setSearchResults,
    hasSearched,
    isSearching,
    validationError,
    setValidationError,
    connectionStatus,
    totalRecords,
    handleSearch: handleSearchClick,
    handleDirectSearch,
    handleSearchWithFilters,
    copyAllResults,
    testConnection,
    debugInfo,
    showFilterModal,
    setShowFilterModal
  };
};
