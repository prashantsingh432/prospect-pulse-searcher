
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Prospect } from "@/data/prospects";
import { SearchResults } from "@/components/SearchResults";
import { SearchAnalytics } from "@/components/SearchAnalytics";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { User, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useAuth();
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

  // Validate search form based on the active tab
  const validateSearch = () => {
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
  };

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
  }, [activeTab, prospectName, companyName, location, linkedinUrl, toast, validationError]);
  
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
            <Tabs defaultValue="prospect-info" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="prospect-info" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Search by Prospect Info</span>
                </TabsTrigger>
                <TabsTrigger value="linkedin-url" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  <span>Search by LinkedIn URL</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="prospect-info" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  <div className="space-y-2">
                    <label htmlFor="prospectName" className="text-sm font-medium flex items-center">
                      Prospect Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      id="prospectName"
                      placeholder="Search by name..."
                      value={prospectName}
                      onChange={(e) => {
                        setProspectName(e.target.value);
                        if (e.target.value.trim() && companyName.trim()) {
                          setValidationError("");
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium flex items-center">
                      Company Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      id="companyName"
                      placeholder="Search by company..."
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (prospectName.trim() && e.target.value.trim()) {
                          setValidationError("");
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
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
              </TabsContent>
              
              <TabsContent value="linkedin-url" className="mt-0">
                <div className="space-y-2">
                  <label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center">
                    LinkedIn URL
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    id="linkedinUrl"
                    placeholder="linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => {
                      setLinkedinUrl(e.target.value);
                      if (e.target.value.trim() && /linkedin\.com\/in\/.+/.test(e.target.value.trim())) {
                        setValidationError("");
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </TabsContent>
              
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
            </Tabs>
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
