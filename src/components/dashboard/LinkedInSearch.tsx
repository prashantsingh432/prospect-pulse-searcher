
import { Input } from "@/components/ui/input";

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
  // LinkedIn URL validation function
  const validateLinkedInUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return false;
    }
    
    // Match pattern: linkedin.com/in/username
    const linkedinPattern = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/;
    return linkedinPattern.test(trimmedUrl);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center">
        LinkedIn URL
        <span className="text-red-500 ml-1">*</span>
      </label>
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
            setValidationError("Please enter a valid LinkedIn URL (format: linkedin.com/in/username)");
          }
        }}
        className="w-full"
      />
      <p className="text-xs text-gray-500">Example: linkedin.com/in/username</p>
    </div>
  );
};
