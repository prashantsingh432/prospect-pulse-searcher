import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, User, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Disposition {
  id: string;
  disposition_type: string;
  custom_reason: string | null;
  created_at: string;
  user_id: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role?: string;
}

interface DispositionHistoryProps {
  prospectId: number;
  refreshTrigger?: number;
}

const dispositionLabels: Record<string, string> = {
  not_interested: "Not Interested",
  wrong_number: "Wrong Number",
  dnc: "DNC (Do Not Call)",
  call_back_later: "Call Back Later",
  not_relevant: "Not Relevant",
  others: "Others",
};

const dispositionColors: Record<string, string> = {
  not_interested: "bg-red-100 text-red-600 border-red-200",
  wrong_number: "bg-yellow-100 text-yellow-600 border-yellow-200",
  dnc: "bg-red-100 text-red-600 border-red-200",
  call_back_later: "bg-blue-100 text-blue-600 border-blue-200",
  not_relevant: "bg-slate-100 text-slate-600 border-slate-200",
  others: "bg-purple-100 text-purple-600 border-purple-200",
};

const getRoleIcon = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'admin': return '🛡️';
    case 'caller': return '👤';
    default: return '👤';
  }
};

export function DispositionHistory({ prospectId, refreshTrigger }: DispositionHistoryProps) {
  const [dispositions, setDispositions] = useState<Disposition[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser, isAdmin } = useAuth();

  const fetchDispositions = async () => {
    try {
      const { data: dispositionsData, error: dispositionsError } = await supabase
        .from("dispositions")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false });

      if (dispositionsError) {
        console.error("Dispositions error:", dispositionsError);
        throw dispositionsError;
      }

      setDispositions(dispositionsData || []);

      // Fetch user details for each disposition
      const userIds = [...new Set(dispositionsData?.map(d => d.user_id) || [])];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name, email, role")
          .in("id", userIds);

        if (usersError) {
          console.error("Users error:", usersError);
          throw usersError;
        }

        const usersMap = (usersData || []).reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, User>);

        setUsers(usersMap);
      }
    } catch (error) {
      console.error("Error fetching dispositions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch disposition history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDisposition = async (dispositionId: string, dispositionUserId: string) => {
    // Check permissions: only admin or the user who created it can delete
    if (!isAdmin() && currentUser?.id !== dispositionUserId) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own dispositions",
        variant: "destructive",
      });
      return;
    }

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

      // Refresh the list
      fetchDispositions();
    } catch (error) {
      console.error("Error deleting disposition:", error);
      toast({
        title: "Error", 
        description: "Failed to delete disposition",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDispositions();

    // Set up real-time subscription
    const channel = supabase
      .channel('dispositions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispositions',
          filter: `prospect_id=eq.${prospectId}`
        },
        () => {
          fetchDispositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prospectId, refreshTrigger]);

  const hasDNCDisposition = dispositions.some(d => d.disposition_type === "dnc");

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dispositions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {/* DNC Warning */}
      {hasDNCDisposition && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Warning:</strong> This number is marked as DNC (Do Not Call) by{" "}
            {users[dispositions.find(d => d.disposition_type === "dnc")?.user_id || ""]?.name || "an agent"} on{" "}
            {format(new Date(dispositions.find(d => d.disposition_type === "dnc")?.created_at || ""), "dd MMM yyyy")}.
          </AlertDescription>
        </Alert>
      )}

      {/* Disposition History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Disposition History ({dispositions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dispositions.map((disposition) => (
              <div key={disposition.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border transition-all hover:shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${dispositionColors[disposition.disposition_type]} border`}>
                      {dispositionLabels[disposition.disposition_type]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      📅 {format(new Date(disposition.created_at), "dd MMM yyyy, h:mm a")}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getRoleIcon(users[disposition.user_id]?.role)}</span>
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {users[disposition.user_id]?.name || users[disposition.user_id]?.email || "Unknown Agent"}
                    </span>
                    {users[disposition.user_id]?.role && (
                      <Badge variant="outline" className="text-xs">
                        {users[disposition.user_id].role}
                      </Badge>
                    )}
                  </div>

                  {disposition.custom_reason && (
                    <div className="mt-2 text-sm text-foreground bg-white p-2 rounded-lg border">
                      <strong>Reason:</strong> {disposition.custom_reason}
                    </div>
                  )}
                </div>

                {/* Delete button - only show if user can delete */}
                {(isAdmin() || currentUser?.id === disposition.user_id) && (
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
                          onClick={() => handleDeleteDisposition(disposition.id, disposition.user_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}