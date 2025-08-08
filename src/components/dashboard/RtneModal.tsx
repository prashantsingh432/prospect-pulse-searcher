import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateLinkedInUrl } from "@/utils/linkedInUtils";

interface RtneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RtneRow {
  prospect_linkedin: string;
  full_name?: string;
  company_name?: string;
  prospect_city?: string;
  prospect_number?: string;
  prospect_email?: string;
  prospect_number2?: string;
  prospect_number3?: string;
  prospect_number4?: string;
  prospect_designation?: string;
}

export const RtneModal: React.FC<RtneModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");
  const [row, setRow] = useState<RtneRow>({ prospect_linkedin: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof RtneRow, value: string) => {
    setRow((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      toast({ title: "Project required", description: "Please enter a project name.", variant: "destructive" });
      return;
    }
    if (!validateLinkedInUrl(row.prospect_linkedin || "")) {
      toast({ title: "Invalid URL", description: "Please enter a valid LinkedIn profile URL.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("rtne-check-or-create", {
        body: { projectName, row },
      });
      if (error) throw error;

      toast({
        title: data?.message || "Processed",
        description: data?.creditAllocated ? "Credit allocated for first-time master creation." : "No credit consumed (duplicate).",
      });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "RTNE failed", description: e.message || "Unexpected error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Real-Time Email & Number (RTNE)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Project Name</label>
              <Input placeholder="e.g., Amplior - US SaaS" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              <p className="text-xs mt-1 opacity-70">We will create it if it doesn’t exist and add you as owner.</p>
            </div>
          </div>

          <div className="overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>prospect_linkedin</TableHead>
                  <TableHead>full_name</TableHead>
                  <TableHead>company_name</TableHead>
                  <TableHead>prospect_city</TableHead>
                  <TableHead>prospect_number</TableHead>
                  <TableHead>prospect_email</TableHead>
                  <TableHead>prospect_number2</TableHead>
                  <TableHead>prospect_number3</TableHead>
                  <TableHead>prospect_number4</TableHead>
                  <TableHead>prospect_designation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="min-w-[220px]"><Input placeholder="https://www.linkedin.com/in/..." value={row.prospect_linkedin || ""} onChange={(e) => handleChange("prospect_linkedin", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.full_name || ""} onChange={(e) => handleChange("full_name", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.company_name || ""} onChange={(e) => handleChange("company_name", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.prospect_city || ""} onChange={(e) => handleChange("prospect_city", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.prospect_number || ""} onChange={(e) => handleChange("prospect_number", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.prospect_email || ""} onChange={(e) => handleChange("prospect_email", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.prospect_number2 || ""} onChange={(e) => handleChange("prospect_number2", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.prospect_number3 || ""} onChange={(e) => handleChange("prospect_number3", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.prospect_number4 || ""} onChange={(e) => handleChange("prospect_number4", e.target.value)} /></TableCell>
                  <TableCell><Input value={row.prospect_designation || ""} onChange={(e) => handleChange("prospect_designation", e.target.value)} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Run RTNE"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
