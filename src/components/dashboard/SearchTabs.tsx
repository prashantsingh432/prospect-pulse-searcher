
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProspectInfoSearch } from "./ProspectInfoSearch";
import { LinkedInSearch } from "./LinkedInSearch";
import { PhoneNumberSearch } from "./PhoneNumberSearch";
import { Linkedin, User, Phone } from "lucide-react";

interface SearchTabsProps {
  prospectName: string;
  setProspectName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
  activeTab: string;
  setActiveTab: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
}

export const SearchTabs = ({
  prospectName,
  setProspectName,
  companyName,
  setCompanyName,
  location,
  setLocation,
  linkedinUrl,
  setLinkedinUrl,
  phoneNumber,
  setPhoneNumber,
  validationError,
  setValidationError,
  activeTab,
  setActiveTab,
  isSearching,
  onSearch
}: SearchTabsProps) => {
  return (
    <Tabs defaultValue="prospect-info" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="prospect-info" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Search by Prospect Info</span>
        </TabsTrigger>
        <TabsTrigger value="linkedin-url" className="flex items-center gap-2">
          <Linkedin className="h-4 w-4" />
          <span>Search by LinkedIn URL</span>
        </TabsTrigger>
        <TabsTrigger value="phone-number" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <span>Search by Phone Number</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="prospect-info" className="mt-0">
        <ProspectInfoSearch 
          prospectName={prospectName}
          setProspectName={setProspectName}
          companyName={companyName}
          setCompanyName={setCompanyName}
          location={location}
          setLocation={setLocation}
          validationError={validationError}
          setValidationError={setValidationError}
        />
      </TabsContent>
      
      <TabsContent value="linkedin-url" className="mt-0">
        <LinkedInSearch 
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          validationError={validationError}
          setValidationError={setValidationError}
        />
      </TabsContent>
      
      <TabsContent value="phone-number" className="mt-0">
        <PhoneNumberSearch 
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          validationError={validationError}
          setValidationError={setValidationError}
        />
      </TabsContent>
      
      {validationError && (
        <div className="mt-4 text-red-500 text-sm">{validationError}</div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={onSearch} 
          disabled={isSearching} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSearching ? "Searching..." : "🔍 Search"}
        </Button>
      </div>
    </Tabs>
  );
};
