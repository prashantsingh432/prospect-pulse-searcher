
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
          setLinkedinUrl(e.target.value);
          if (e.target.value.trim() && /linkedin\.com\/in\/.+/.test(e.target.value.trim())) {
            setValidationError("");
          }
        }}
        className="w-full"
      />
    </div>
  );
};
