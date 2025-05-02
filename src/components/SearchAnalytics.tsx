
import { Prospect } from "@/data/prospects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SearchAnalyticsProps {
  results: Prospect[];
  totalRecords: number;
}

export const SearchAnalytics = ({ results, totalRecords }: SearchAnalyticsProps) => {
  // Calculate most frequent company
  const companyFrequency: Record<string, number> = {};
  
  results.forEach(prospect => {
    companyFrequency[prospect.company] = (companyFrequency[prospect.company] || 0) + 1;
  });
  
  let mostFrequentCompany = "";
  let highestFrequency = 0;
  
  Object.entries(companyFrequency).forEach(([company, frequency]) => {
    if (frequency > highestFrequency) {
      mostFrequentCompany = company;
      highestFrequency = frequency;
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">✅ {results.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            matching records found
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Most Frequent Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">🏢 {mostFrequentCompany || "N/A"}</div>
          <p className="text-xs text-muted-foreground mt-1">
            appears in {highestFrequency} record{highestFrequency !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Database Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">📁 {totalRecords}</div>
          <p className="text-xs text-muted-foreground mt-1">
            records available in database
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
