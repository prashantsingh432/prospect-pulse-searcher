import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface DispositionEntryProps {
  prospectId: number;
  onDispositionAdded: () => void;
}

const dispositionOptions = [
  // Negative/Rejection Dispositions
  { value: "not_interested", label: "Not Interested" },
  { value: "not_connected", label: "Not Connected" },
  { value: "duplicate_prospect", label: "Duplicate Prospect" },
  { value: "irrelevant_company", label: "Irrelevant Company" },
  { value: "contact_details_irrelevant", label: "Contact Details Irrelevant" },
  { value: "not_interested_in_company", label: "Not Interested in Company" },
  { value: "reception_call_with_receptionist", label: "Reception Call with Receptionist" },
  { value: "irrelevant_designation", label: "Irrelevant Designation" },
  { value: "irrelevant_location", label: "Irrelevant Location" },
  { value: "person_irrelevant", label: "Person Irrelevant" },

  // Do Not Call Dispositions
  { value: "do_not_call", label: "Do Not Call" },
  { value: "dnc", label: "DNC" },

  // Hold/Wait Dispositions
  { value: "hold_for_now", label: "Hold For Now" },
  { value: "contract_renewal_year", label: "Contract Renewal – Year" },
  { value: "long_term_contract", label: "Long Term Contract" },
  { value: "no_requirements", label: "No Requirements" },

  // Follow-up Dispositions
  { value: "call_back", label: "Call Back" },
  { value: "call_back_later", label: "Call Back Later" },
  { value: "follow_up", label: "Follow Up" },
  { value: "mail_sent", label: "Mail Sent" },

  // Meeting Dispositions
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
  { value: "meeting_successful", label: "Meeting Successful" },
  { value: "meeting_cancel", label: "Meeting Cancel" },

  // Service-related Dispositions
  { value: "using_dtss_services", label: "Using DTSS Services" },
  { value: "already_in_touch_with_project", label: "Already in Touch with my project" },

  // Legacy/Other
  { value: "wrong_number", label: "Wrong Number" },
  { value: "not_relevant", label: "Not Relevant" },
  { value: "others", label: "Others" },
];

export function DispositionEntry({ prospectId, onDispositionAdded }: DispositionEntryProps) {
  const [selectedDisposition, setSelectedDisposition] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Allow all authenticated users to add dispositions
  if (!user) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span>⚠️</span>
            <div>
              <p className="font-medium">Authentication Required</p>
              <p className="text-sm">Please log in to add dispositions.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!selectedDisposition) {
      toast({
        title: "Error",
        description: "Please select a disposition",
        variant: "destructive",
      });
      return;
    }

    if (selectedDisposition === "others" && !customReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for 'Others'",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting disposition:", { prospectId, userId: user?.id, selectedDisposition, customReason });

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Prepare request data
      const requestData = {
        prospect_id: prospectId,
        disposition_type: selectedDisposition,
        custom_reason: selectedDisposition === "others" ? customReason.trim() : null,
      };

      console.log("Calling edge function with data:", requestData);

      // Call the edge function to create disposition with proper user data
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-disposition`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create disposition');
      }

      const result = await response.json();
      console.log("Disposition created successfully:", result);

      toast({
        title: "Success",
        description: "Disposition saved successfully",
      });

      // Reset form
      setSelectedDisposition("");
      setCustomReason("");
      onDispositionAdded();
    } catch (error) {
      console.error("Error saving disposition:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save disposition",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Add Disposition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="disposition">Disposition</Label>
          <Select value={selectedDisposition} onValueChange={setSelectedDisposition}>
            <SelectTrigger>
              <SelectValue placeholder="Select disposition reason" />
            </SelectTrigger>
            <SelectContent>
              {dispositionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDisposition === "others" && (
          <div className="space-y-2">
            <Label htmlFor="customReason">Reason</Label>
            <Textarea
              id="customReason"
              placeholder="Please specify the reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={!selectedDisposition || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Disposition"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}