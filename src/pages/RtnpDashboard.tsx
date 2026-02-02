import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderOpen, Clock, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface ProjectStats {
  project_name: string;
  pending_count: number;
  completed_count: number;
}

export const RtnpDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const isRtnpUser = user?.email === 'realtimenumberprovider@amplior.com' || isAdmin();

  // Load project stats function - memoized for real-time updates
  const loadProjectStats = useCallback(async () => {
    try {
      // Get all unique projects from users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('project_name')
        .not('project_name', 'is', null)
        .neq('project_name', 'ADMIN');

      if (usersError) throw usersError;

      // Get unique project names
      const uniqueProjects = [...new Set(usersData?.map(u => u.project_name).filter(Boolean))];

      // Get only MRE-requested items - these are the only ones RTNP should see
      const { data: requestsData, error: requestsError } = await supabase
        .from('rtne_requests')
        .select('project_name, status, mre_requested')
        .eq('mre_requested', true);

      if (requestsError) throw requestsError;

      // Create stats for each project
      const statsMap = new Map<string, ProjectStats>();
      
      // Initialize all projects with 0 counts
      uniqueProjects.forEach(projectName => {
        statsMap.set(projectName, {
          project_name: projectName,
          pending_count: 0,
          completed_count: 0
        });
      });

      // Count MRE requests per project
      requestsData?.forEach(request => {
        const existing = statsMap.get(request.project_name);
        if (existing) {
          if (request.status === 'pending') {
            existing.pending_count++;
          } else if (request.status === 'completed') {
            existing.completed_count++;
          }
        }
      });

      const stats = Array.from(statsMap.values()).sort((a, b) => 
        a.project_name.localeCompare(b.project_name)
      );
      setProjectStats(stats);
      setTotalPending(stats.reduce((sum, s) => sum + s.pending_count, 0));
    } catch (error: any) {
      console.error("Error loading project stats:", error);
    }
  }, []);

  useEffect(() => {
    if (!isRtnpUser) {
      navigate("/dashboard");
      return;
    }

    // Initial load
    setIsLoading(true);
    loadProjectStats().finally(() => setIsLoading(false));

    // Set up real-time subscription for rtne_requests
    const channel = supabase
      .channel('rtnp-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rtne_requests',
        },
        (payload) => {
          console.log('[RTNP Dashboard] Real-time update:', payload.eventType, payload);
          
          // Check if this is an MRE request (new or updated)
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          if (payload.eventType === 'INSERT' && newRecord?.mre_requested) {
            toast.info(`New MRE request from ${newRecord.project_name}`);
          } else if (payload.eventType === 'UPDATE' && newRecord?.mre_requested && !oldRecord?.mre_requested) {
            toast.info(`New MRE request from ${newRecord.project_name}`);
          }
          
          // Reload stats on any change
          loadProjectStats();
        }
      )
      .subscribe((status) => {
        console.log('[RTNP Dashboard] Realtime status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[RTNP Dashboard] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [isRtnpUser, navigate, loadProjectStats]);

  const handleProjectClick = (projectName: string) => {
    navigate(`/rtnp/project/${encodeURIComponent(projectName)}`);
  };

  if (!isRtnpUser) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-2">Real-Time Number Provider Dashboard</h1>
          <div className="flex items-center gap-2">
            {isRealtimeConnected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <WifiOff className="h-3 w-3 mr-1" />
                Connecting...
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          Showing only MRE (Mystery Request) items - requests explicitly sent by agents for number lookup
        </p>
      </div>

      {/* Summary Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Total Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600">{totalPending}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Across {projectStats.length} project{projectStats.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading projects...</span>
        </div>
      ) : projectStats.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No requests found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Requests will appear here when agents submit LinkedIn URLs
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectStats.map((project) => (
            <Card
              key={project.project_name}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
              onClick={() => handleProjectClick(project.project_name)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{project.project_name}</span>
                  {project.pending_count > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {project.pending_count}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Click to view requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {project.pending_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {project.completed_count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
