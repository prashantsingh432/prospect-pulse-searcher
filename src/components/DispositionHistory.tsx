import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, User, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  not_interested: "bg-red-100 text-red-800",
  wrong_number: "bg-yellow-100 text-yellow-800",
  dnc: "bg-red-100 text-red-800",
  call_back_later: "bg-blue-100 text-blue-800",
  not_relevant: "bg-gray-100 text-gray-800",
  others: "bg-purple-100 text-purple-800",
};

export function DispositionHistory({ prospectId, refreshTrigger }: DispositionHistoryProps) {
  const [dispositions, setDispositions] = useState<Disposition[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDispositions = async () => {
    try {
      const { data: dispositionsData, error: dispositionsError } = await supabase
        .from("dispositions")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false });

      if (dispositionsError) throw dispositionsError;

      setDispositions(dispositionsData || []);

      // Fetch user details for each disposition
      const userIds = [...new Set(dispositionsData?.map(d => d.user_id) || [])];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", userIds);

        if (usersError) throw usersError;

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

  useEffect(() => {
    fetchDispositions();
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
              <div key={disposition.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${dispositionColors[disposition.disposition_type]} border-0`}>
                      {dispositionLabels[disposition.disposition_type]}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      📅 {format(new Date(disposition.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>
                      {users[disposition.user_id]?.name || users[disposition.user_id]?.email || "Unknown Agent"}
                    </span>
                  </div>

                  {disposition.custom_reason && (
                    <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border">
                      <strong>Reason:</strong> {disposition.custom_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}