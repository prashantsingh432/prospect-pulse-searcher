
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, HelpCircle, Check, X } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { validateLinkedInUrl, formatLinkedInUrl, extractLinkedInUsername } from "@/utils/linkedInUtils";
import type { UrlMatchInfo } from "@/services/prospectSearchService";

interface LinkedInSearchProps {
  linkedinUrl: string;
  setLinkedinUrl: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
  onSearch: () => void;
  urlMatches?: UrlMatchInfo[];
}

export const LinkedInSearch = ({
  linkedinUrl,
  setLinkedinUrl,
  validationError,
  setValidationError,
  onSearch,
  urlMatches = [],
}: LinkedInSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const urls = linkedinUrl.trim() ? linkedinUrl.trim().split(/[\n,]+/).filter(url => url.trim()) : [];
  const urlCount = urls.length;

  // Create a map for quick lookup of match status
  const getMatchStatus = (url: string): 'matched' | 'not_found' | 'pending' => {
    if (urlMatches.length === 0) return 'pending';
    
    const normalizedInput = url.toLowerCase().trim();
    const username = extractLinkedInUsername(url);
    
    const match = urlMatches.find(m => {
      const normalizedMatch = m.url.toLowerCase().trim();
      const matchUsername = extractLinkedInUsername(m.url);
      return normalizedMatch === normalizedInput || 
             (username && matchUsername && username === matchUsername);
    });
    
    if (!match) return 'pending';
    return match.matched ? 'matched' : 'not_found';
  };

  const matchedCount = urlMatches.filter(m => m.matched).length;
  const notFoundCount = urlMatches.filter(m => !m.matched).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center flex-wrap gap-2">
          <span>LinkedIn URLs (up to 10)</span>
          <span className="text-red-500">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <HelpCircle size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Paste multiple LinkedIn URLs (one per line or comma-separated). We'll search all of them at once.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {urlCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded ${urlCount > 10 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {urlCount} URL{urlCount !== 1 ? 's' : ''}
            </span>
          )}
          {urlMatches.length > 0 && (
            <>
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                <Check size={12} /> {matchedCount} found
              </span>
              {notFoundCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                  <X size={12} /> {notFoundCount} not in DB
                </span>
              )}
            </>
          )}
        </label>
        
        {/* URL Input with inline match status */}
        <div className="relative">
          {urlMatches.length > 0 && urls.length > 0 ? (
            // Show URLs with match status
            <div className={`w-full min-h-[100px] border rounded-md p-2 bg-background ${validationError && linkedinUrl ? 'border-red-500' : 'border-input'}`}>
              <div className="space-y-1">
                {urls.map((url, index) => {
                  const status = getMatchStatus(url);
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center justify-between py-1 px-2 rounded text-sm ${
                        status === 'matched' 
                          ? 'bg-green-50' 
                          : status === 'not_found'
                          ? 'bg-red-50'
                          : 'bg-muted/30'
                      }`}
                    >
                      <span className="truncate flex-1 mr-2 font-mono text-xs">
                        {url}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {status === 'matched' ? (
                          <Check size={16} className="text-green-600" />
                        ) : status === 'not_found' ? (
                          <X size={16} className="text-red-600" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setLinkedinUrl("")}
              >
                Clear & search again
              </Button>
            </div>
          ) : (
            // Show regular textarea for input
            <>
              <Textarea
                id="linkedinUrl"
                placeholder="linkedin.com/in/username1&#10;linkedin.com/in/username2&#10;linkedin.com/in/username3"
                value={linkedinUrl}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLinkedinUrl(newValue);
                  
                  const parsedUrls = newValue.trim().split(/[\n,]+/).filter(url => url.trim());
                  
                  if (parsedUrls.length > 10) {
                    setValidationError("Maximum 10 URLs allowed");
                  } else if (parsedUrls.length > 0) {
                    const invalidUrls = parsedUrls.filter(url => !validateLinkedInUrl(url.trim()));
                    if (invalidUrls.length > 0) {
                      setValidationError(`${invalidUrls.length} invalid URL(s) - must contain 'linkedin.com'`);
                    } else {
                      setValidationError("");
                    }
                  } else {
                    setValidationError("");
                  }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  // Format URLs on blur
                  if (linkedinUrl) {
                    const parsedUrls = linkedinUrl.split(/[\n,]+/).filter(url => url.trim());
                    const formatted = parsedUrls.map(url => formatLinkedInUrl(url.trim())).join('\n');
                    setLinkedinUrl(formatted);
                  }
                }}
                onKeyDown={handleKeyDown}
                className={`w-full min-h-[100px] ${validationError && linkedinUrl ? 'border-red-500' : ''}`}
                rows={5}
              />
              
              {validationError && linkedinUrl && !isFocused && (
                <div className="absolute right-2 top-2.5 text-red-500">
                  <AlertCircle size={16} />
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="text-xs">
          <p className="text-gray-500">Accepted Formats:</p>
          <ul className="ml-4 list-disc text-gray-400">
            <li>One URL per line or comma-separated</li>
            <li>linkedin.com/in/username</li>
            <li>https://www.linkedin.com/in/username</li>
            <li>www.linkedin.com/in/username</li>
          </ul>
        </div>
      </div>
      
      {validationError && linkedinUrl && !isFocused && (
        <div className="text-sm text-red-500 flex items-center">
          <AlertCircle size={14} className="mr-1" /> 
          {validationError}
        </div>
      )}
    </div>
  );
};
