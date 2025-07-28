import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter } from "lucide-react";

export interface SearchFilters {
  emailOnly: boolean;
  phoneOnly: boolean;
  both: boolean;
}

interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

export const SearchFilterModal = ({ isOpen, onClose, onSearch }: SearchFilterModalProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    emailOnly: false,
    phoneOnly: false,
    both: false,
  });

  const handleFilterChange = (key: keyof SearchFilters, checked: boolean) => {
    setFilters(prev => {
      // If checking one filter, uncheck others (mutually exclusive)
      const newFilters = {
        emailOnly: false,
        phoneOnly: false,
        both: false,
      };
      
      if (checked) {
        newFilters[key] = true;
      }
      
      return newFilters;
    });
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      emailOnly: false,
      phoneOnly: false,
      both: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Contact Details Filter
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Must contain
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="email-only"
                checked={filters.emailOnly}
                onCheckedChange={(checked) => handleFilterChange('emailOnly', checked as boolean)}
                className="rounded-sm"
              />
              <label htmlFor="email-only" className="text-sm font-medium cursor-pointer">
                Work email
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="phone-only"
                checked={filters.phoneOnly}
                onCheckedChange={(checked) => handleFilterChange('phoneOnly', checked as boolean)}
                className="rounded-sm"
              />
              <label htmlFor="phone-only" className="text-sm font-medium cursor-pointer">
                Phone
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="both"
                checked={filters.both}
                onCheckedChange={(checked) => handleFilterChange('both', checked as boolean)}
                className="rounded-sm"
              />
              <label htmlFor="both" className="text-sm font-medium cursor-pointer">
                Both
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex-1"
            >
              Reset
            </Button>
            <Button 
              onClick={handleSearch}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};