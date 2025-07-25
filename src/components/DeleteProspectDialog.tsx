import { useState } from "react";
import { Prospect } from "@/data/prospects";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeleteProspectDialogProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (prospectId: number) => void;
}

export const DeleteProspectDialog = ({
  prospect,
  isOpen,
  onClose,
  onDelete,
}: DeleteProspectDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!prospect?.id) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("prospects")
        .delete()
        .eq("id", prospect.id);

      if (error) throw error;

      onDelete(prospect.id);
      onClose();
      
      toast({
        title: "Success",
        description: "Prospect deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting prospect:", error);
      toast({
        title: "Error",
        description: "Failed to delete prospect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this prospect?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>{prospect?.name}</strong> from <strong>{prospect?.company}</strong>{" "}
            and remove all their data from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};