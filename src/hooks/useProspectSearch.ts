
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Prospect } from "@/data/prospects";
import { supabase } from "@/integrations/supabase/client";

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
      if (!prospectName.trim() || !companyName.trim()) {
        setValidationError("Both Prospect Name and Company Name are required");
        return false;
      }
    } else if (activeTab === "linkedin-url") {
      if (!linkedinUrl.trim()) {
        setValidationError("LinkedIn URL is required");
        return false;
      }
      
      // Simple validation for LinkedIn URL format
      const linkedinPattern = /linkedin\.com\/in\/.+/;
      if (!linkedinPattern.test(linkedinUrl.trim())) {
        setValidationError("Please enter a valid LinkedIn URL (format: linkedin.com/in/username)");
        return false;
      }
    }
    
    setValidationError("");
    return true;
  }, [activeTab, prospectName, companyName, linkedinUrl]);

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
    
    try {
      let query = supabase.from("prospects").select("*");
      
      console.log("Starting search with parameters:", {
        activeTab,
        prospectName,
        companyName,
        location,
        linkedinUrl
      });
      
      // Different query logic based on active tab
      if (activeTab === "linkedin-url") {
        // Option B: Search by LinkedIn URL only
        console.log("Searching by LinkedIn URL:", linkedinUrl);
        query = query.ilike("prospect_linkedin", `%${linkedinUrl.trim()}%`);
      } else {
        // Option A: Search by Prospect Name AND Company Name, with optional Location
        console.log("Searching by Prospect and Company Name");
        query = query
          .ilike("full_name", `%${prospectName.trim()}%`)
          .ilike("company_name", `%${companyName.trim()}%`);
        
        // Add location filter if provided
        if (location.trim()) {
          console.log("Adding location filter:", location);
          query = query.ilike("prospect_city", `%${location.trim()}%`);
        }
      }
      
      console.log("Executing search query");
      const { data, error } = await query;
      
      if (error) {
        console.error("Search error:", error);
        throw error;
      }
      
      console.log("Search results:", data);
      
      // Map database fields to our frontend model
      const results = (data || []).map(record => ({
        id: record.id,
        name: record.full_name,
        company: record.company_name,
        location: record.prospect_city || "",
        phone: record.prospect_number || "",
        email: record.prospect_email || "",
        linkedin: record.prospect_linkedin || ""
      })) as Prospect[];
      
      setSearchResults(results);
      setHasSearched(true);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try adjusting your search criteria.",
        });
      } else {
        toast({
          title: "Search complete",
          description: `Found ${results.length} matching prospects.`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [activeTab, prospectName, companyName, location, linkedinUrl, toast, validationError, validateSearch]);

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
    handleSearch,
    copyAllResults
  };
};
