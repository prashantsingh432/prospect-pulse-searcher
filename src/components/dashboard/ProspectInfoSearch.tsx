
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ProspectInfoSearchProps {
  prospectName: string;
  setProspectName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
}

export const ProspectInfoSearch = ({
  prospectName,
  setProspectName,
  companyName,
  setCompanyName,
  location,
  setLocation,
  validationError,
  setValidationError,
}: ProspectInfoSearchProps) => {
  const validateFields = () => {
    if (companyName.trim()) {
      setValidationError("");
    } else {
      setValidationError("Company Name is required");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-6">
      <div className="space-y-2">
        <label htmlFor="companyName" className="text-sm font-medium flex items-center">
          Company Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <Input
          id="companyName"
          placeholder="Search by company..."
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value);
            if (e.target.value.trim()) {
              setValidationError("");
            } else {
              setValidationError("Company Name is required");
            }
          }}
          onBlur={validateFields}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="prospectName" className="text-sm font-medium flex items-center">
          Prospect Name
          <span className="text-gray-400 ml-1 text-xs">(optional)</span>
        </label>
        <Input
          id="prospectName"
          placeholder="Search by name..."
          value={prospectName}
          onChange={(e) => {
            setProspectName(e.target.value);
            // No validation needed for prospect name as it's optional
          }}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2 md:col-span-2">
        <label htmlFor="location" className="text-sm font-medium">
          Location <span className="text-gray-400">(optional)</span>
        </label>
        <Input
          id="location"
          placeholder="City, State or leave blank"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
};
