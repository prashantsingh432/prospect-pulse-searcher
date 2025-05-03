
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Prospect } from "@/data/prospects";
import { SearchResults } from "@/components/SearchResults";
import { SearchAnalytics } from "@/components/SearchAnalytics";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [prospectName, setProspectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Fetch all prospects for analytics
  const { data: allProspects, isLoading } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      console.log("Fetching all prospects");
      const { data, error } = await supabase
        .from("prospects")
        .select("*");
      
      if (error) {
        console.error("Error fetching prospects:", error);
        throw error;
      }
      
      console.log("Fetched prospects:", data);
      
      // Map database fields to our frontend model
      return (data || []).map(record => ({
        id: record.id,
        name: record.full_name,
        company: record.company_name,
        location: record.prospect_city || "",
        phone: record.prospect_number || "",
        email: record.prospect_email || "",
        linkedin: record.prospect_linkedin || ""
      })) as Prospect[];
    }
  });

  // Validate search form - at least one of name, company or LinkedIn URL must be provided
  const validateSearch = () => {
    if (!prospectName.trim() && !companyName.trim() && !linkedinUrl.trim()) {
      setValidationError("Please provide at least one search field (Prospect Name, Company Name, or LinkedIn URL)");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSearch = useCallback(async () => {
    // Validate that at least one search field is provided
    if (!validateSearch()) {
      toast({
        title: "Required fields missing",
        description: "Please provide at least one search field (Prospect Name, Company Name, or LinkedIn URL).",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      console.log("Starting search with parameters:", {
        prospectName,
        companyName,
        location,
        linkedinUrl
      });
      
      // Start building the query
      let query = supabase.from("prospects").select("*");
      
      // Track if we've added any filters
      let filtersAdded = false;
      
      // Add filters if values are provided (using case insensitive search)
      if (prospectName.trim()) {
        console.log("Adding prospect name filter:", prospectName);
        query = query.ilike("full_name", `%${prospectName.trim()}%`);
        filtersAdded = true;
      }
      
      if (companyName.trim()) {
        console.log("Adding company name filter:", companyName);
        query = query.ilike("company_name", `%${companyName.trim()}%`);
        filtersAdded = true;
      }
      
      // Add location filter if provided
      if (location.trim()) {
        console.log("Adding location filter:", location);
        query = query.ilike("prospect_city", `%${location.trim()}%`);
        filtersAdded = true;
      }
      
      // Add LinkedIn filter if provided
      if (linkedinUrl.trim()) {
        console.log("Adding LinkedIn URL filter:", linkedinUrl);
        query = query.ilike("prospect_linkedin", `%${linkedinUrl.trim()}%`);
        filtersAdded = true;
      }

      if (!filtersAdded) {
        toast({
          title: "No search criteria provided",
          description: "Please enter at least one search criterion",
          variant: "destructive",
        });
        setIsSearching(false);
        return;
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
  }, [prospectName, companyName, location, linkedinUrl, toast]);
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Search Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <label htmlFor="prospectName" className="text-sm font-medium flex items-center">
                  Prospect Name
                  {!companyName.trim() && !linkedinUrl.trim() && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Input
                  id="prospectName"
                  placeholder="Search by name..."
                  value={prospectName}
                  onChange={(e) => {
                    setProspectName(e.target.value);
                    if (e.target.value.trim() || companyName.trim() || linkedinUrl.trim()) {
                      setValidationError("");
                    }
                  }}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium flex items-center">
                  Company Name
                  {!prospectName.trim() && !linkedinUrl.trim() && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Input
                  id="companyName"
                  placeholder="Search by company..."
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (prospectName.trim() || e.target.value.trim() || linkedinUrl.trim()) {
                      setValidationError("");
                    }
                  }}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center">
                  LinkedIn URL
                  {!prospectName.trim() && !companyName.trim() && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Input
                  id="linkedinUrl"
                  placeholder="linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => {
                    setLinkedinUrl(e.target.value);
                    if (prospectName.trim() || companyName.trim() || e.target.value.trim()) {
                      setValidationError("");
                    }
                  }}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-gray-400">(optional)</span>
                </label>
                <Input
                  id="location"
                  placeholder="City, State or leave blank"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            {validationError && (
              <div className="mt-4 text-red-500 text-sm">{validationError}</div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? "Searching..." : "🔍 Search"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {hasSearched && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium">Search Results</h2>
              {searchResults.length > 0 && (
                <Button variant="outline" onClick={copyAllResults}>
                  📋 Copy All Results
                </Button>
              )}
            </div>
            
            <SearchResults results={searchResults} />
            
            {searchResults.length > 0 && (
              <div className="mt-8">
                <SearchAnalytics 
                  results={searchResults}
                  totalRecords={allProspects?.length || 50}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
