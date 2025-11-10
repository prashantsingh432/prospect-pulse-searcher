
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, HelpCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { validateLinkedInUrl, formatLinkedInUrl } from "@/utils/linkedInUtils";

interface LinkedInSearchProps {
  linkedinUrl: string;
  setLinkedinUrl: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
  onSearch: () => void;
}

export const LinkedInSearch = ({
  linkedinUrl,
  setLinkedinUrl,
  validationError,
  setValidationError,
  onSearch,
}: LinkedInSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const urlCount = linkedinUrl.trim() ? linkedinUrl.trim().split(/[\n,]+/).filter(url => url.trim()).length : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center">
          LinkedIn URLs (up to 5)
          <span className="text-red-500 ml-1">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1">
                  <HelpCircle size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Paste multiple LinkedIn URLs (one per line or comma-separated). We'll search all of them at once.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {urlCount > 0 && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${urlCount > 5 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {urlCount} URL{urlCount !== 1 ? 's' : ''}
            </span>
          )}
        </label>
        <div className="relative">
          <Textarea
            id="linkedinUrl"
            placeholder="linkedin.com/in/username1&#10;linkedin.com/in/username2&#10;linkedin.com/in/username3"
            value={linkedinUrl}
            onChange={(e) => {
              const newValue = e.target.value;
              setLinkedinUrl(newValue);
              
              const urls = newValue.trim().split(/[\n,]+/).filter(url => url.trim());
              
              if (urls.length > 5) {
                setValidationError("Maximum 5 URLs allowed");
              } else if (urls.length > 0) {
                const invalidUrls = urls.filter(url => !validateLinkedInUrl(url.trim()));
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
                const urls = linkedinUrl.split(/[\n,]+/).filter(url => url.trim());
                const formatted = urls.map(url => formatLinkedInUrl(url.trim())).join('\n');
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
