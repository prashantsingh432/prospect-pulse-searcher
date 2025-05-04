
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase, testSupabaseConnection } from "@/integrations/supabase/client";
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

  // Fetch all prospects for analytics - disabled for now until connection is fixed
  const { data: allProspects, isLoading, error: fetchError } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      console.log("Fetching all prospects");
      try {
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
      } catch (err) {
        console.error("Query error:", err);
        return [] as Prospect[];
      }
    },
    enabled: false // Disable the query until connection is fixed
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
        {connectionStatus && (
          <Alert variant={connectionStatus.connected ? "default" : "destructive"} className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {connectionStatus.connected 
                  ? `Connected to database. Last checked: ${connectionStatus.lastChecked?.toLocaleTimeString()}` 
                  : `Database connection issue: ${connectionStatus.message}`}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testConnection}
                disabled={isSearching}
              >
                Test Connection
              </Button>
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
          debugInfo={debugInfo}
        />
      </main>
    </div>
  );
};

export default Dashboard;
