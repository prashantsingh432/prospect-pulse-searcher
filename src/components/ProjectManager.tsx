import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FolderKanban, Plus, Trash2, Edit, RefreshCw, AlertTriangle } from "lucide-react";

type ProjectData = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export const ProjectManager = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  // Form states
  const [newProjectName, setNewProjectName] = useState("");
  const [editProjectName, setEditProjectName] = useState("");

  const { toast } = useToast();

  // Fetch projects from database
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_names')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setProjects(data || []);
      toast({
        title: "Success",
        description: `Loaded ${data?.length || 0} projects`,
      });

    } catch (error: any) {
      console.error("Fetch projects error:", error);
      toast({
        title: "Error Fetching Projects",
        description: error.message || "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new project
  const addProject = async () => {
    if (!newProjectName?.trim()) {
      toast({
        title: "Missing Information",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('project_names')
        .insert({
          name: newProjectName.trim(),
          created_by: user?.id,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('A project with this name already exists');
        }
        throw error;
      }

      toast({
        title: "Success",
        description: `Project "${newProjectName}" created successfully`,
      });

      setNewProjectName("");
      setIsAddModalOpen(false);
      fetchProjects();

    } catch (error: any) {
      console.error("Create project error:", error);
      toast({
        title: "Error Creating Project",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update project
  const updateProject = async () => {
    if (!selectedProject || !editProjectName?.trim()) {
      toast({
        title: "Missing Information",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('project_names')
        .update({ name: editProjectName.trim() })
        .eq('id', selectedProject.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('A project with this name already exists');
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      setIsEditModalOpen(false);
      setSelectedProject(null);
      fetchProjects();

    } catch (error: any) {
      console.error("Update project error:", error);
      toast({
        title: "Error Updating Project",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete projects
  const deleteProjects = async (ids: string[]) => {
    if (!ids.length) {
      toast({
        title: "Error",
        description: "Please select at least one project to delete",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if any projects are in use
      const { data: usersWithProjects, error: checkError } = await supabase
        .from('users')
        .select('project_name')
        .in('project_name', projects.filter(p => ids.includes(p.id)).map(p => p.name));

      if (checkError) throw checkError;

      if (usersWithProjects && usersWithProjects.length > 0) {
        toast({
          title: "Cannot Delete",
          description: `${usersWithProjects.length} user(s) are assigned to selected project(s). Please reassign them first.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('project_names')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${ids.length} project${ids.length > 1 ? 's' : ''} deleted successfully`,
      });

      setSelectedProjectIds(new Set());
      setIsDeleteModalOpen(false);
      fetchProjects();

    } catch (error: any) {
      console.error("Delete projects error:", error);
      toast({
        title: "Error Deleting Projects",
        description: error.message || "Failed to delete projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle project selection
  const toggleProjectSelection = (id: string) => {
    setSelectedProjectIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle all projects
  const toggleAllProjects = (checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(new Set(projects.map(p => p.id)));
    } else {
      setSelectedProjectIds(new Set());
    }
  };

  // Open edit modal
  const openEditModal = (project: ProjectData) => {
    setSelectedProject(project);
    setEditProjectName(project.name);
    setIsEditModalOpen(true);
  };

  // Set up real-time subscription and initial fetch
  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('project_names_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_names'
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isAllSelected = projects.length > 0 && selectedProjectIds.size === projects.length;
  const isIndeterminate = selectedProjectIds.size > 0 && selectedProjectIds.size < projects.length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-sm border-r p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Project Management</h2>
            <p className="text-sm text-gray-600">Manage available projects for user assignment</p>
          </div>

          {/* Stats Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <FolderKanban className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Total Projects</p>
                  <p className="text-2xl font-bold text-blue-600">{projects.length}</p>
                  <p className="text-xs text-blue-700">available for assignment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={fetchProjects}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Projects
            </Button>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full justify-start"
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Project
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription>Create a new project that can be assigned to users</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="Enter project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addProject()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button onClick={addProject} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {selectedProjectIds.size === 1 && (
              <Button
                onClick={() => {
                  const project = projects.find(p => selectedProjectIds.has(p.id));
                  if (project) openEditModal(project);
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Selected
              </Button>
            )}

            {selectedProjectIds.size > 0 && (
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="destructive"
                className="w-full justify-start"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedProjectIds.size})
              </Button>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Projects in use by users cannot be deleted. Reassign users first.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>Manage project names for user assignment</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && projects.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No projects found. Add your first project to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleAllProjects}
                      />
                    </TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className={selectedProjectIds.has(project.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedProjectIds.has(project.id)}
                          onCheckedChange={() => toggleProjectSelection(project.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant={project.is_active ? 'default' : 'secondary'}>
                          {project.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editProjectName">Project Name</Label>
              <Input
                id="editProjectName"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateProject()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={updateProject} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Projects</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProjectIds.size} project{selectedProjectIds.size > 1 ? 's' : ''}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteProjects(Array.from(selectedProjectIds))}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};