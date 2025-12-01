import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface EnrichmentLoadingModalProps {
  isOpen: boolean;
  searchStage: "database" | "phone" | "email" | "complete";
}

const EnrichmentLoadingModal: React.FC<EnrichmentLoadingModalProps> = ({
  isOpen,
  searchStage,
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md border-none bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-8 gap-6">
          {/* Spinner */}
          <div className="enrichment-spinner" />

          {/* Animated Text */}
          <div className="enrichment-loader">
            Searching&nbsp;
            <div className="enrichment-words">
              <div className="enrichment-word">in database</div>
              <div className="enrichment-word">phone number</div>
              <div className="enrichment-word">email</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrichmentLoadingModal;
