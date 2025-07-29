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
  { value: "not_interested", label: "Not Interested" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "dnc", label: "DNC (Do Not Call)" },
  { value: "call_back_later", label: "Call Back Later" },
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
      
      // First, sync the current user profile to ensure they exist in the users table
      try {
        await supabase.rpc('sync_user_profile');
        console.log("User profile synced successfully");
      } catch (syncError) {
        console.warn("Could not sync user profile:", syncError);
      }

      const dispositionData = {
        prospect_id: prospectId,
        user_id: user?.id,
        disposition_type: selectedDisposition as "not_interested" | "wrong_number" | "dnc" | "call_back_later" | "not_relevant" | "others",
        custom_reason: selectedDisposition === "others" ? customReason.trim() : null,
      };

      console.log("Inserting disposition data:", dispositionData);

      const { data, error } = await supabase
        .from("dispositions")
        .insert(dispositionData)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Disposition saved successfully:", data);

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
        description: "Failed to save disposition",
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