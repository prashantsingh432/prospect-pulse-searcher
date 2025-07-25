import React, { useState } from "react";
import { Prospect } from "@/data/prospects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditProspectDialogProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProspect: Prospect) => void;
}

export const EditProspectDialog = ({
  prospect,
  isOpen,
  onClose,
  onUpdate,
}: EditProspectDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    designation: "",
    email: "",
    phone: "",
    phone2: "",
    phone3: "",
    phone4: "",
    linkedin: "",
    location: "",
  });

  // Update form data when prospect changes
  React.useEffect(() => {
    if (prospect) {
      setFormData({
        company: prospect.company || "",
        name: prospect.name || "",
        designation: prospect.designation || "",
        email: prospect.email || "",
        phone: prospect.phone || "",
        phone2: prospect.phone2 || "",
        phone3: prospect.phone3 || "",
        phone4: prospect.phone4 || "",
        linkedin: prospect.linkedin || "",
        location: prospect.location || "",
      });
    }
  }, [prospect]);

  const handleSave = async () => {
    // Phase 1: Validation
    if (!prospect?.id) {
      console.error("❌ No prospect ID available for update", { prospect });
      toast({
        title: "Error",
        description: "Invalid prospect data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.company?.trim() || !formData.name?.trim()) {
      console.error("❌ Required fields missing", { company: formData.company, name: formData.name });
      toast({
        title: "Validation Error",
        description: "Company name and full name are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("🚀 Starting prospect update process...");

    try {
      // Phase 2: Test Supabase Connection
      console.log("🔍 Testing Supabase connection...");
      const { data: testData, error: testError } = await supabase
        .from("prospects")
        .select("id")
        .eq("id", prospect.id)
        .maybeSingle();
      
      if (testError) {
        console.error("❌ Supabase connection test failed:", testError);
        throw new Error(`Connection test failed: ${testError.message}`);
      }
      
      if (!testData) {
        console.error("❌ Prospect not found in database:", prospect.id);
        throw new Error("Prospect not found in database");
      }
      
      console.log("✅ Supabase connection successful, prospect exists");

      // Phase 3: Prepare Clean Update Payload
      console.log("📝 Preparing update payload...");
      console.log("Current form data:", formData);
      
      const updatePayload = {
        company_name: formData.company?.trim() || null,
        full_name: formData.name?.trim() || null,
        prospect_designation: formData.designation?.trim() || null,
        prospect_email: formData.email?.trim() || null,
        prospect_number: formData.phone?.trim() || null,
        prospect_number2: formData.phone2?.trim() || null,
        prospect_number3: formData.phone3?.trim() || null,
        prospect_number4: formData.phone4?.trim() || null,
        prospect_linkedin: formData.linkedin?.trim() || null,
        prospect_city: formData.location?.trim() || null,
      };
      
      console.log("📤 Clean update payload:", updatePayload);

      // Phase 4: Execute Supabase Update
      console.log("💾 Executing database update...");
      const { data, error } = await supabase
        .from("prospects")
        .update(updatePayload)
        .eq("id", prospect.id)
        .select()
        .maybeSingle();

      console.log("📨 Supabase update response:", { data, error });

      if (error) {
        console.error("❌ Supabase update error:", error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      if (!data) {
        console.error("❌ No data returned from update operation");
        throw new Error("Update operation returned no data");
      }

      console.log("✅ Database update successful");

      // Phase 5: Convert and Validate Response
      const updatedProspect: Prospect = {
        id: data.id,
        company: data.company_name || "",
        name: data.full_name || "",
        designation: data.prospect_designation || "",
        email: data.prospect_email || "",
        phone: data.prospect_number || "",
        phone2: data.prospect_number2 || "",
        phone3: data.prospect_number3 || "",
        phone4: data.prospect_number4 || "",
        linkedin: data.prospect_linkedin || "",
        location: data.prospect_city || "",
      };

      console.log("✅ Converted updated prospect:", updatedProspect);

      // Phase 6: Update UI State
      console.log("🔄 Updating UI state...");
      onUpdate(updatedProspect);
      onClose();
      
      console.log("🎉 Prospect update completed successfully!");
      toast({
        title: "Success",
        description: "Prospect updated successfully.",
      });

    } catch (error) {
      console.error("❌ Error in handleSave:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "Update Failed",
        description: `Failed to update prospect: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("🏁 Update process finished");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Prospect</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Company name"
            />
          </div>
          
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              value={formData.designation}
              onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              placeholder="Job title"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Primary phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="phone2">Phone Number 2</Label>
            <Input
              id="phone2"
              value={formData.phone2}
              onChange={(e) => setFormData(prev => ({ ...prev, phone2: e.target.value }))}
              placeholder="Secondary phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="phone3">Phone Number 3</Label>
            <Input
              id="phone3"
              value={formData.phone3}
              onChange={(e) => setFormData(prev => ({ ...prev, phone3: e.target.value }))}
              placeholder="Third phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="phone4">Phone Number 4</Label>
            <Input
              id="phone4"
              value={formData.phone4}
              onChange={(e) => setFormData(prev => ({ ...prev, phone4: e.target.value }))}
              placeholder="Fourth phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              placeholder="LinkedIn profile URL"
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State or location"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !formData.company || !formData.name}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};