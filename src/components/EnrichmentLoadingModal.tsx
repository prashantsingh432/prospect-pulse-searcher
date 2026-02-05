import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface EnrichmentLoadingModalProps {
  isOpen: boolean;
  searchSource: "database" | "lusha";
  stage: "searching" | "not_found" | "enriching_lusha";
  onCancel?: () => void;
}

const EnrichmentLoadingModal: React.FC<EnrichmentLoadingModalProps> = ({
  isOpen,
  searchSource,
  stage,
  onCancel,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent 
        className="max-w-md border-none bg-background/95 backdrop-blur-sm [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Custom close button that cancels the enrichment */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-full p-1.5 bg-muted hover:bg-muted/80 opacity-70 ring-offset-background transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
            aria-label="Cancel enrichment"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex flex-col items-center justify-center py-8 gap-6">
          {/* Spinner */}
          <div className="enrichment-spinner" />

          {/* Animated Text */}
          {stage === "searching" ? (
            <div className="enrichment-loader">
              Searching&nbsp;
              <div className="enrichment-words">
                <div className={`enrichment-word ${searchSource === "database" ? "text-green-500" : "text-blue-500"}`}>
                  in {searchSource}
                </div>
                <div className={`enrichment-word ${searchSource === "database" ? "text-green-500" : "text-blue-500"}`}>
                  phone number
                </div>
                <div className={`enrichment-word ${searchSource === "database" ? "text-green-500" : "text-blue-500"}`}>
                  email
                </div>
              </div>
            </div>
          ) : stage === "enriching_lusha" ? (
            <div className="enrichment-loader">
              <span className="text-blue-600 font-semibold">Enriching from Lusha</span>
              <div className="enrichment-words">
                <div className="enrichment-word text-blue-500">
                  fetching phone numbers
                </div>
                <div className="enrichment-word text-blue-500">
                  fetching emails
                </div>
                <div className="enrichment-word text-blue-500">
                  fetching details
                </div>
              </div>
            </div>
          ) : (
            <div className="enrichment-loader">
              <span className="text-red-500">Not found in database</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrichmentLoadingModal;
