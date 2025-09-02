import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Loader2, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

interface AdminDispositionManagerProps {
  prospectId: number;
  onDispositionChange: () => void;
}

interface Disposition {
  id: string;
  disposition_type: string;
  custom_reason: string | null;
  created_at: string;
  user_id: string;
  user_name?: string | null;
  project_name?: string | null;
}

const dispositionOptions = [
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
  { value: "do_not_call", label: "Do Not Call" },
  { value: "dnc", label: "DNC" },
  { value: "hold_for_now", label: "Hold For Now" },
  { value: "contract_renewal_year", label: "Contract Renewal – Year" },
  { value: "long_term_contract", label: "Long Term Contract" },
  { value: "no_requirements", label: "No Requirements" },
  { value: "call_back", label: "Call Back" },
  { value: "call_back_later", label: "Call Back Later" },
  { value: "follow_up", label: "Follow Up" },
  { value: "mail_sent", label: "Mail Sent" },
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
  { value: "meeting_successful", label: "Meeting Successful" },
  { value: "meeting_cancel", label: "Meeting Cancel" },
  { value: "using_our_services", label: "Already Working with Our Project" },
  { value: "already_in_touch_with_team", label: "Already in Touch with Our Team" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "not_relevant", label: "Not Relevant" },
  { value: "others", label: "Others" },
];

const dispositionLabels: Record<string, string> = {
  not_interested: "Not Interested",
  not_connected: "Not Connected",
  duplicate_prospect: "Duplicate Prospect",
  irrelevant_company: "Irrelevant Company",
  contact_details_irrelevant: "Contact Details Irrelevant",
  not_interested_in_company: "Not Interested in Company",
  reception_call_with_receptionist: "Reception Call with Receptionist",
  irrelevant_designation: "Irrelevant Designation",
  irrelevant_location: "Irrelevant Location",
  person_irrelevant: "Person Irrelevant",
  do_not_call: "Do Not Call",
  dnc: "DNC",
  hold_for_now: "Hold For Now",
  contract_renewal_year: "Contract Renewal – Year",
  long_term_contract: "Long Term Contract",
  no_requirements: "No Requirements",
  call_back: "Call Back",
  call_back_later: "Call Back Later",
  follow_up: "Follow Up",
  mail_sent: "Mail Sent",
  meeting_scheduled: "Meeting Scheduled",
  meeting_successful: "Meeting Successful",
  meeting_cancel: "Meeting Cancel",
  using_our_services: "Already Working with Our Project",
  already_in_touch_with_team: "Already in Touch with Our Team",
  wrong_number: "Wrong Number",
  not_relevant: "Not Relevant",
  others: "Others",
};

export function AdminDispositionManager({ prospectId, onDispositionChange }: AdminDispositionManagerProps) {
  const [selectedDisposition, setSelectedDisposition] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispositions, setDispositions] = useState<Disposition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Only show this component for admin users
  if (!user || !isAdmin()) {
    return null;
  }

  const fetchDispositions = async () => {
    try {
      const { data, error } = await supabase
        .from("dispositions")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDispositions(data || []);
    } catch (error) {
      console.error("Error fetching dispositions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispositions();

    // Set up real-time subscription for dispositions
    const channel = supabase
      .channel(`admin_dispositions_${prospectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispositions',
          filter: `prospect_id=eq.${prospectId}`
        },
        (payload) => {
          console.log("Admin: Real-time disposition change received:", payload);
          fetchDispositions();
          onDispositionChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prospectId, onDispositionChange]);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const requestData = {
        prospect_id: prospectId,
        disposition_type: selectedDisposition,
        custom_reason: selectedDisposition === "others" ? customReason.trim() : null,
      };

      // Call the edge function to create disposition
      let result: any | null = null;
      let fnError: any | null = null;

      try {
        const invokeRes = await supabase.functions.invoke('create-disposition', {
          body: requestData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        result = invokeRes.data;
        fnError = invokeRes.error;
      } catch (e: any) {
        fnError = e;
      }

      // Fallback: direct fetch if invoke fails
      if (fnError && /Failed to send a request to the Edge Function/i.test(String(fnError?.message))) {
        const resp = await fetch('https://lodpoepylygsryjdkqjg.supabase.co/functions/v1/create-disposition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Edge function error (${resp.status}): ${text || resp.statusText}`);
        }
        result = await resp.json();
        fnError = null;
      }

      if (fnError) {
        throw new Error(fnError.message || 'Failed to create disposition');
      }

      toast({
        title: "Success",
        description: "Disposition added successfully",
      });

      // Reset form
      setSelectedDisposition("");
      setCustomReason("");
      fetchDispositions();
      onDispositionChange();
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

  const handleDeleteDisposition = async (dispositionId: string) => {
    try {
      const { error } = await supabase
        .from("dispositions")
        .delete()
        .eq("id", dispositionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Disposition deleted successfully",
      });

      fetchDispositions();
      onDispositionChange();
    } catch (error) {
      console.error("Error deleting disposition:", error);
      toast({
        title: "Error",
        description: "Failed to delete disposition",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-600" />
          Admin Disposition Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Disposition Form */}
        <div className="space-y-4 p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <Label className="font-medium">Add New Disposition</Label>
          </div>
          
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
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Disposition
              </>
            )}
          </Button>
        </div>

        {/* Current Dispositions List */}
        <div className="space-y-2">
          <Label className="font-medium">Current Dispositions ({dispositions.length})</Label>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : dispositions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No dispositions found</div>
          ) : (
            <div className="space-y-2">
              {dispositions.map((disposition) => (
                <div key={disposition.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {dispositionLabels[disposition.disposition_type]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(disposition.created_at), "dd MMM h:mmaaa")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      by {disposition.user_name || 'Unknown User'}
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Disposition</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this disposition? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteDisposition(disposition.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}