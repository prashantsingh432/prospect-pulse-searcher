
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/data/prospects";
import { useProspectSearch } from "@/hooks/useProspectSearch";
import { SearchContainer } from "@/components/dashboard/SearchContainer";
import { ResultsContainer } from "@/components/dashboard/ResultsContainer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const {
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
    connectionError,
    handleSearch,
    copyAllResults
  } = useProspectSearch();

  // Fetch all prospects for analytics
  const { data: allProspects, isLoading, error: fetchError } = useQuery({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {connectionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Database connection error: {connectionError}
            </AlertDescription>
          </Alert>
        )}
        
        {fetchError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading prospects: {fetchError instanceof Error ? fetchError.message : "Unknown error"}
            </AlertDescription>
          </Alert>
        )}
        
        <SearchContainer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          prospectName={prospectName}
          setProspectName={setProspectName}
          companyName={companyName}
          setCompanyName={setCompanyName}
          location={location}
          setLocation={setLocation}
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          validationError={validationError}
          setValidationError={setValidationError}
          isSearching={isSearching}
          onSearch={handleSearch}
        />
        
        <ResultsContainer
          hasSearched={hasSearched}
          searchResults={searchResults}
          copyAllResults={copyAllResults}
          totalRecords={allProspects?.length || 0}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

export default Dashboard;
