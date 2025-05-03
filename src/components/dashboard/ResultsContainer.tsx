
import { Button } from "@/components/ui/button";
import { SearchResults } from "@/components/SearchResults";
import { SearchAnalytics } from "@/components/SearchAnalytics";
import { Prospect } from "@/data/prospects";
import { Loader2 } from "lucide-react";

interface ResultsContainerProps {
  hasSearched: boolean;
  searchResults: Prospect[];
  copyAllResults: () => void;
  totalRecords: number;
  isLoading?: boolean;
}

export const ResultsContainer = ({
  hasSearched,
  searchResults,
  copyAllResults,
  totalRecords,
  isLoading = false
}: ResultsContainerProps) => {
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
            totalRecords={totalRecords}
          />
        </div>
      )}
    </>
  );
};
