import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderOpen, Clock } from "lucide-react";

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

  const isRtnpUser = user?.email === 'realtimenumberprovider@amplior.com' || isAdmin();

  useEffect(() => {
    if (!isRtnpUser) {
      navigate("/dashboard");
      return;
    }

    loadProjectStats();
  }, [isRtnpUser, navigate]);

  const loadProjectStats = async () => {
    setIsLoading(true);
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

      // Get all requests to count pending/completed per project
      const { data: requestsData, error: requestsError } = await supabase
        .from('rtne_requests')
        .select('project_name, status');

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

      // Count requests per project
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (projectName: string) => {
    navigate(`/rtnp/project/${encodeURIComponent(projectName)}`);
  };

  if (!isRtnpUser) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Real-Time Number Provider Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of pending LinkedIn URL requests across all projects
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
