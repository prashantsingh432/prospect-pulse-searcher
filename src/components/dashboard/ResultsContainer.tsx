
import { Button } from "@/components/ui/button";
import { SearchResults } from "@/components/SearchResults";
import { SearchAnalytics } from "@/components/SearchAnalytics";
import { Prospect } from "@/data/prospects";

interface ResultsContainerProps {
  hasSearched: boolean;
  searchResults: Prospect[];
  copyAllResults: () => void;
  totalRecords: number;
}

export const ResultsContainer = ({
  hasSearched,
  searchResults,
  copyAllResults,
  totalRecords
}: ResultsContainerProps) => {
  if (!hasSearched) {
    return null;
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
