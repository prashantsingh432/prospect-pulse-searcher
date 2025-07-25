
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProspectInfoSearch } from "./ProspectInfoSearch";
import { LinkedInSearch } from "./LinkedInSearch";
import { Linkedin, User } from "lucide-react";

interface SearchTabsProps {
  prospectName: string;
  setProspectName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (value: string) => void;
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
  phoneNumber,
  setPhoneNumber,
  linkedinUrl,
  setLinkedinUrl,
  validationError,
  setValidationError,
  activeTab,
  setActiveTab,
  isSearching,
  onSearch
}: SearchTabsProps) => {
  return (
    <Tabs defaultValue="prospect-info" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="prospect-info" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Search by Prospect Info</span>
        </TabsTrigger>
        <TabsTrigger value="linkedin-url" className="flex items-center gap-2">
          <Linkedin className="h-4 w-4" />
          <span>Search by LinkedIn URL</span>
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
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          validationError={validationError}
          setValidationError={setValidationError}
          onSearch={onSearch}
        />
      </TabsContent>
      
      <TabsContent value="linkedin-url" className="mt-0">
        <LinkedInSearch 
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          validationError={validationError}
          setValidationError={setValidationError}
          onSearch={onSearch}
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
