
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchTabs } from "./SearchTabs";
import { useState } from "react";

interface SearchContainerProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  prospectName: string;
  setProspectName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
}

export const SearchContainer = ({
  activeTab,
  setActiveTab,
  prospectName,
  setProspectName,
  companyName,
  setCompanyName,
  location,
  setLocation,
  linkedinUrl,
  setLinkedinUrl,
  validationError,
  setValidationError,
  isSearching,
  onSearch
}: SearchContainerProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Search Prospects</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          prospectName={prospectName}
          setProspectName={setProspectName}
          companyName={companyName}
          setCompanyName={setCompanyName}
          location={location}
          setLocation={setLocation}
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          validationError={validationError}
          setValidationError={setValidationError}
          isSearching={isSearching}
          onSearch={onSearch}
        />
      </CardContent>
    </Card>
  );
};
