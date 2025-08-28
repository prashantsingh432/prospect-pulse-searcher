import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone } from "lucide-react";
import { useDisposition } from "@/contexts/DispositionContext";
import { useAuth } from "@/contexts/AuthContext";

export const DispositionWarning = () => {
  const { hasPendingDisposition, revealedPhones, getPendingDispositionMessage, clearAllPendingDispositions } = useDisposition();
  const { isAdmin } = useAuth();

  // Don't show warning for admin users
  if (isAdmin() || !hasPendingDisposition) {
    return null;
  }

  const pendingPhones = revealedPhones.filter(phone => phone.dispositionRequired);

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium mb-2">Disposition Required</p>
            <p className="text-sm mb-3">{getPendingDispositionMessage()}</p>
            
            {pendingPhones.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Revealed phone numbers requiring disposition:</p>
                <div className="space-y-1">
                  {pendingPhones.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-amber-100 px-2 py-1 rounded">
                      <Phone className="h-3 w-3" />
                      <span className="font-mono">{phone.phoneNumber}</span>
                      <span className="text-amber-600">
                        (Prospect ID: {phone.prospectId})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllPendingDispositions}
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
            >
              Clear All
            </Button>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> You must fill out dispositions for all revealed phone numbers before you can perform new searches.
            Scroll down to find the "Add Disposition" section for each prospect.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
