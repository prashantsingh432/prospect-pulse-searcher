
import { Button } from "@/components/ui/button";
import { SearchResults } from "@/components/SearchResults";
import { SearchAnalytics } from "@/components/SearchAnalytics";
import { Prospect } from "@/data/prospects";
import { Loader2, Bug } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResultsContainerProps {
  hasSearched: boolean;
  searchResults: Prospect[];
  copyAllResults: () => void;
  totalRecords: number;
  isLoading?: boolean;
  debugInfo?: any;
  isAdmin?: boolean;
}

export const ResultsContainer = ({
  hasSearched,
  searchResults,
  copyAllResults,
  totalRecords,
  isLoading = false,
  debugInfo,
  isAdmin = false
}: ResultsContainerProps) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!hasSearched) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading results...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Search Results</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              <Bug size={16} className="mr-1" />
              {showDebug ? "Hide Debug" : "Show Debug"}
            </Button>
          )}
          {searchResults.length > 0 && (
            <Button variant="outline" onClick={copyAllResults}>
              📋 Copy All Results
            </Button>
          )}
        </div>
      </div>
      
      {/* Debug Info */}
      {showDebug && debugInfo && (
        <Card className="mb-4 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono overflow-auto max-h-60 bg-slate-100 p-2 rounded">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
      
      <SearchResults results={searchResults} />
      
      {searchResults.length > 0 && (
        <div className="mt-8">
          <SearchAnalytics 
            results={searchResults}
            totalRecords={totalRecords}
          />
        </div>
      )}
    </>
  );
};
