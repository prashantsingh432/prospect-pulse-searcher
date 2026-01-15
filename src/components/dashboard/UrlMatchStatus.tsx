import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { extractLinkedInUsername } from "@/utils/linkedInUtils";

interface UrlMatchInfo {
  url: string;
  normalizedUrl: string;
  matched: boolean;
  matchedProspectIds: number[];
}

interface UrlMatchStatusProps {
  urlMatches: UrlMatchInfo[];
}

export const UrlMatchStatus = ({ urlMatches }: UrlMatchStatusProps) => {
  if (!urlMatches || urlMatches.length === 0) {
    return null;
  }

  const matchedCount = urlMatches.filter(m => m.matched).length;
  const unmatchedCount = urlMatches.filter(m => !m.matched).length;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>LinkedIn URL Match Status</span>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
              <Check size={12} className="mr-1" />
              {matchedCount} matched
            </Badge>
            {unmatchedCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                <X size={12} className="mr-1" />
                {unmatchedCount} not found
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {urlMatches.map((match, index) => {
            const username = extractLinkedInUsername(match.url);
            const displayName = username || match.url;
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between py-1 px-2 rounded text-sm ${
                  match.matched 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <span className="truncate flex-1 mr-2 font-mono text-xs">
                  {displayName}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {match.matched ? (
                    <>
                      <Check size={14} className="text-green-600" />
                      <span className="text-xs text-green-600">Found</span>
                    </>
                  ) : (
                    <>
                      <X size={14} className="text-red-600" />
                      <span className="text-xs text-red-600">Not in DB</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
