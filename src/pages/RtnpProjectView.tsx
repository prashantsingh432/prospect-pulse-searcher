import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save, User, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface RtneRequest {
  id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  linkedin_url: string;
  full_name?: string;
  city?: string;
  job_title?: string;
  company_name?: string;
  email_address?: string;
  primary_phone?: string;
  status: string;
  row_number: number;
  created_at: string;
}

export const RtnpProjectView: React.FC = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RtneRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});

  const isRtnpUser = user?.email === 'realtimenumberprovider@amplior.com' || isAdmin();

  useEffect(() => {
    if (!isRtnpUser || !projectName) {
      navigate("/dashboard");
      return;
    }

    loadProjectRequests();
  }, [isRtnpUser, projectName, navigate]);

  const loadProjectRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rtne_requests')
        .select('*')
        .eq('project_name', decodeURIComponent(projectName || ''))
        .order('row_number', { ascending: true });

      if (error) throw error;

      setRequests(data || []);
    } catch (error: any) {
      console.error("Error loading requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (requestId: string, field: string, value: string) => {
    // Update local state immediately
    setRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, [field]: value } : req
    ));

    // Clear existing timeout
    if (saveTimeoutRef.current[`${requestId}-${field}`]) {
      clearTimeout(saveTimeoutRef.current[`${requestId}-${field}`]);
    }

    // Set new timeout to save after 1 second
    saveTimeoutRef.current[`${requestId}-${field}`] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .update({ [field]: value })
          .eq('id', requestId);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error saving field:", error);
      }
    }, 1000);
  };

  const markAsCompleted = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('rtne_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request marked as completed",
      });

      loadProjectRequests();
    } catch (error: any) {
      console.error("Error marking as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark as completed",
        variant: "destructive",
      });
    }
  };

  if (!isRtnpUser) {
    return null;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status === 'completed');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/rtnp')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">{decodeURIComponent(projectName || '')}</h1>
          <p className="text-muted-foreground mt-1">
            {pendingRequests.length} pending, {completedRequests.length} completed
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">No requests for this project</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Badge variant="destructive">{pendingRequests.length}</Badge>
                Pending Requests
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="p-4 border-l-4 border-l-orange-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.user_name}</span>
                        <Badge variant="outline">Row {request.row_number}</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => markAsCompleted(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          LinkedIn URL
                        </label>
                        <Input
                          value={request.linkedin_url}
                          readOnly
                          className="mt-1 bg-muted"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Name
                        </label>
                        <Input
                          value={request.full_name || ''}
                          onChange={(e) => handleFieldChange(request.id, 'full_name', e.target.value)}
                          placeholder="Enter full name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          City
                        </label>
                        <Input
                          value={request.city || ''}
                          onChange={(e) => handleFieldChange(request.id, 'city', e.target.value)}
                          placeholder="Enter city"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Job Title
                        </label>
                        <Input
                          value={request.job_title || ''}
                          onChange={(e) => handleFieldChange(request.id, 'job_title', e.target.value)}
                          placeholder="Enter job title"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Company Name
                        </label>
                        <Input
                          value={request.company_name || ''}
                          onChange={(e) => handleFieldChange(request.id, 'company_name', e.target.value)}
                          placeholder="Enter company name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email Address
                        </label>
                        <Input
                          value={request.email_address || ''}
                          onChange={(e) => handleFieldChange(request.id, 'email_address', e.target.value)}
                          placeholder="Enter email"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Primary Phone
                        </label>
                        <Input
                          value={request.primary_phone || ''}
                          onChange={(e) => handleFieldChange(request.id, 'primary_phone', e.target.value)}
                          placeholder="Enter phone number"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Requests */}
          {completedRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {completedRequests.length}
                </Badge>
                Completed Requests
              </h2>
              <div className="space-y-4">
                {completedRequests.map((request) => (
                  <Card key={request.id} className="p-4 border-l-4 border-l-green-500 bg-green-50/30">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.user_name}</span>
                      <Badge variant="outline">Row {request.row_number}</Badge>
                      <Badge className="bg-green-600">Completed</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span> {request.full_name || '-'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">City:</span> {request.city || '-'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Company:</span> {request.company_name || '-'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span> {request.primary_phone || '-'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
