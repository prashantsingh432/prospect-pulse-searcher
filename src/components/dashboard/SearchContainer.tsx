import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchTabs } from "./SearchTabs";
import { SearchFilterModal } from "@/components/SearchFilterModal";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { UrlMatchInfo } from "@/services/prospectSearchService";

interface SearchContainerProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
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
  isSearching: boolean;
  onSearch: () => void;
  onDirectSearch: () => void;
  handleSearchWithFilters: (filters: any) => void;
  showFilterModal: boolean;
  setShowFilterModal: (show: boolean) => void;
  urlMatches?: UrlMatchInfo[];
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
  phoneNumber,
  setPhoneNumber,
  linkedinUrl,
  setLinkedinUrl,
  validationError,
  setValidationError,
  isSearching,
  onSearch,
  onDirectSearch,
  handleSearchWithFilters,
  showFilterModal,
  setShowFilterModal,
  urlMatches = []
}: SearchContainerProps) => {
  const navigate = useNavigate();
  return (
    <>
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Search Prospects</CardTitle>
          <Button variant="secondary" onClick={() => navigate("/rtne")}>RTNE</Button>
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
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            linkedinUrl={linkedinUrl}
            setLinkedinUrl={setLinkedinUrl}
            validationError={validationError}
            setValidationError={setValidationError}
            isSearching={isSearching}
            onSearch={onSearch}
            onDirectSearch={onDirectSearch}
            urlMatches={urlMatches}
          />
        </CardContent>
      </Card>
      
      <SearchFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSearch={handleSearchWithFilters}
      />
    </>
  );
};
