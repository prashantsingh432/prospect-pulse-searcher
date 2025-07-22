
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/data/prospects";
import { useProspectSearch } from "@/hooks/useProspectSearch";
import { SearchContainer } from "@/components/dashboard/SearchContainer";
import { ResultsContainer } from "@/components/dashboard/ResultsContainer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
    phoneNumber,
    setPhoneNumber,
    searchResults,
    hasSearched,
    isSearching,
    validationError,
    setValidationError,
    connectionStatus,
    handleSearch,
    copyAllResults,
    testConnection,
    debugInfo
  } = useProspectSearch();

  const isAdmin = user && user.email === "prashant@admin.com";

  // Fetch all prospects for analytics - enabled now that we've fixed the connection
  const { data: allProspects, isLoading, error: fetchError } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      console.log("Fetching all prospects");
      try {
        // Try to fetch from both tables and combine results
        const { data: prospectsData, error: prospectsError } = await supabase
          .from("prospects")
          .select("*");
        
        if (prospectsError) {
          console.error("Error fetching prospects:", prospectsError);
          throw prospectsError;
        }
        
        console.log("Fetched prospects:", prospectsData);
        
        // Map database fields to our frontend model
        return (prospectsData || []).map((record, index) => ({
          name: record.full_name,
          company: record.company_name,
          designation: record.prospect_designation || "",
          location: record.prospect_city || "",
          phone: record.prospect_number || "",
          phone2: record.prospect_number2 || "",
          phone3: record.prospect_number3 || "",
          phone4: record.prospect_number4 || "",
          email: record.prospect_email || "",
          linkedin: record.prospect_linkedin || ""
        })) as Prospect[];
      } catch (err) {
        console.error("Query error:", err);
        return [] as Prospect[];
      }
    },
    enabled: connectionStatus?.connected // Enable the query when connection is established
  });

  // Log when the dashboard is mounted for debugging purposes
  useEffect(() => {
    console.log("Dashboard mounted");
    // Test connection on mount
    testConnection();
  }, [testConnection]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Connection Status Alert */}
        {/* Removed connection status alert for callers */}
        
        {fetchError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading prospects: {fetchError instanceof Error ? fetchError.message : "Unknown error"}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Debug Info Display */}
        {debugInfo?.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div>
                <strong>Debug Error Info:</strong> 
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(debugInfo.error, null, 2)}
                </pre>
              </div>
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
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          validationError={validationError}
          setValidationError={setValidationError}
          isSearching={isSearching}
          onSearch={handleSearch}
        />
        
        <ResultsContainer
          hasSearched={hasSearched}
          searchResults={searchResults}
          copyAllResults={copyAllResults}
          totalRecords={allProspects?.length || connectionStatus?.recordCount || 0}
          isLoading={isLoading}
          debugInfo={debugInfo}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
};

export default Dashboard;
