
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

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
  
  // More permissive LinkedIn URL validation function - just check if it contains linkedin.com
  const validateLinkedInUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return false;
    }
    
    return /linkedin\.com/i.test(trimmedUrl);
  };

  // Helper to clean up LinkedIn URLs
  const formatLinkedInUrl = (url: string): string => {
    let cleaned = url.trim();
    
    // If it doesn't contain linkedin.com, don't process further
    if (!cleaned.includes('linkedin.com')) {
      return cleaned;
    }
    
    // If it doesn't start with http/https, add it
    if (!cleaned.startsWith('http')) {
      cleaned = 'https://' + cleaned;
    }
    
    return cleaned;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center">
          LinkedIn URL
          <span className="text-red-500 ml-1">*</span>
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
          <p className="text-gray-500">Examples:</p>
          <ul className="ml-4 list-disc text-gray-400">
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
