
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ProspectInfoSearchProps {
  prospectName: string;
  setProspectName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
  onSearch: () => void;
}

export const ProspectInfoSearch = ({
  prospectName,
  setProspectName,
  companyName,
  setCompanyName,
  location,
  setLocation,
  phoneNumber,
  setPhoneNumber,
  validationError,
  setValidationError,
  onSearch,
}: ProspectInfoSearchProps) => {
  const validateFields = () => {
    // Check if only phone number is provided
    const hasOnlyPhoneNumber = phoneNumber.trim() && 
      !prospectName.trim() && 
      !companyName.trim() && 
      !location.trim();
    
    if (hasOnlyPhoneNumber || companyName.trim()) {
      setValidationError("");
    } else {
      setValidationError("Company Name is required");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
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
            validateFields();
          }}
          onBlur={validateFields}
          onKeyDown={handleKeyDown}
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
            validateFields();
          }}
          onKeyDown={handleKeyDown}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium">
          Location <span className="text-gray-400">(optional)</span>
        </label>
        <Input
          id="location"
          placeholder="City, State or leave blank"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            validateFields();
          }}
          onKeyDown={handleKeyDown}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phoneNumber" className="text-sm font-medium">
          Phone Number <span className="text-gray-400">(optional)</span>
        </label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="Search by phone..."
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            validateFields();
          }}
          onKeyDown={handleKeyDown}
          className="w-full"
        />
      </div>
    </div>
  );
};
