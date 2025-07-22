import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneNumberSearchProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
}

export const PhoneNumberSearch = ({
  phoneNumber,
  setPhoneNumber,
  validationError,
  setValidationError,
}: PhoneNumberSearchProps) => {
  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone-number" className="text-sm font-medium">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone-number"
          type="text"
          placeholder="Enter phone number (e.g., 9568471243 or +91 9568471243)"
          value={phoneNumber}
          onChange={(e) => handlePhoneNumberChange(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Enter any format: 9568471243, +91 9568471243, or (+91) 956-847-1243
        </p>
      </div>
    </div>
  );
};