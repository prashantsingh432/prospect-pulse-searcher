
import { Input } from "@/components/ui/input";
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
}

export const LinkedInSearch = ({
  linkedinUrl,
  setLinkedinUrl,
  validationError,
  setValidationError,
}: LinkedInSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center">
          LinkedIn URL
          <span className="text-red-500 ml-1">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1">
                  <HelpCircle size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>We'll try to match this URL with our database. URLs are normalized for better matching.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <div className="relative">
          <Input
            id="linkedinUrl"
            placeholder="linkedin.com/in/username"
            value={linkedinUrl}
            onChange={(e) => {
              const newValue = e.target.value;
              setLinkedinUrl(newValue);
              
              if (validateLinkedInUrl(newValue)) {
                setValidationError("");
              } else if (newValue.trim()) {
                setValidationError("Please enter a URL containing 'linkedin.com'");
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              // Format URL on blur
              if (linkedinUrl) {
                setLinkedinUrl(formatLinkedInUrl(linkedinUrl));
              }
            }}
            className={`w-full ${validationError && linkedinUrl ? 'border-red-500' : ''}`}
          />
          
          {validationError && linkedinUrl && !isFocused && (
            <div className="absolute right-2 top-2.5 text-red-500">
              <AlertCircle size={16} />
            </div>
          )}
        </div>
        
        <div className="text-xs">
          <p className="text-gray-500">URL Formats We Accept:</p>
          <ul className="ml-4 list-disc text-gray-400">
            <li>linkedin.com/in/username</li>
            <li>https://www.linkedin.com/in/username</li>
            <li>www.linkedin.com/in/username</li>
            <li>linkedin.com/in/username/</li>
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
