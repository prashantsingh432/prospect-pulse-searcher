
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Prospect, prospects } from "@/data/prospects";
import { SearchResults } from "@/components/SearchResults";
import { SearchAnalytics } from "@/components/SearchAnalytics";
import { Navbar } from "@/components/Navbar";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [prospectName, setProspectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(() => {
    if (!prospectName.trim() || !companyName.trim()) {
      toast({
        title: "Required fields missing",
        description: "Prospect name and company name are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    // Simulate API search delay
    setTimeout(() => {
      const results = prospects.filter((prospect) => {
        const nameMatch = prospect.name.toLowerCase().includes(prospectName.toLowerCase());
        const companyMatch = prospect.company.toLowerCase().includes(companyName.toLowerCase());
        const locationMatch = !location.trim() || prospect.location.toLowerCase().includes(location.toLowerCase());
        
        return nameMatch && companyMatch && locationMatch;
      });
      
      setSearchResults(results);
      setHasSearched(true);
      setIsSearching(false);
      
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
    }, 500);
  }, [prospectName, companyName, location, toast]);
  
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
            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              <div className="space-y-2">
                <label htmlFor="prospectName" className="text-sm font-medium">
                  Prospect Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="prospectName"
                  placeholder="Search by name..."
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="companyName"
                  placeholder="Search by company..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
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
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSearch} disabled={isSearching}>
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
                <SearchAnalytics results={searchResults} totalRecords={prospects.length} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
