import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, UserPlus, UserMinus, Shield, Phone, Trash2, Edit, RefreshCw } from "lucide-react";

type UserData = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_active: string | null;
  project_name: string;
  created_at: string;
  updated_at?: string;
};

type UserStats = {
  totalUsers: number;
  admins: number;
  callers: number;
};

export const UserCreator = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalUsers: 0, admins: 0, callers: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<string>("");
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<UserData | null>(null);

  // Add user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("caller");
  const [newUserProjectName, setNewUserProjectName] = useState("");

  // Edit user form state
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("caller");
  const [editUserProjectName, setEditUserProjectName] = useState("");

  const { toast } = useToast();

  // Calculate user statistics
  const calculateStats = (userList: UserData[]) => {
    const stats = {
      totalUsers: userList.length,
      admins: userList.filter(u => u.role === 'admin').length,
      callers: userList.filter(u => u.role === 'caller').length
    };
    setUserStats(stats);
    return stats;
  };

  // Call the edge function to manage auth users
  const callAuthFunction = async (action: string, data?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const url = new URL(`https://lodpoepylygsryjdkqjg.supabase.co/functions/v1/manage-auth-users`);
    url.searchParams.set('action', action);

    const response = await fetch(url.toString(), {
      method: action === 'list' ? 'GET' : 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: action === 'list' ? undefined : JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  };

  // Fetch users from auth.users via edge function
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const result = await callAuthFunction('list');
      const userData = result.users || [];
      setUsers(userData);
      calculateStats(userData);

      toast({
        title: "Success",
        description: `Loaded ${userData.length} users successfully`,
      });

    } catch (error: any) {
      console.error("Fetch users error:", error);
      toast({
        title: "Error Fetching Users",
        description: error.message || "Failed to fetch users from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new auth user via edge function
  const addUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await callAuthFunction('create', {
        email: newUserEmail,
        password: newUserPassword,
        fullName: newUserName,
        projectName: newUserRole === 'admin' ? 'ADMIN' : newUserProjectName,
        role: newUserRole
      });

      toast({
        title: "Success",
        description: `User ${newUserEmail} created with login credentials`,
      });

      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("caller");
      setNewUserProjectName("");
      setIsAddModalOpen(false);

      // Refresh the list
      fetchUsers();

    } catch (error: any) {
      console.error("Create user error:", error);
      toast({
        title: "Error Creating User",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing auth user via edge function
  const updateUser = async () => {
    if (!selectedUserToEdit || !editUserName || !editUserEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await callAuthFunction('update', {
        userId: selectedUserToEdit.id,
        email: editUserEmail,
        fullName: editUserName,
        projectName: editUserRole === 'admin' ? 'ADMIN' : editUserProjectName,
        role: editUserRole
      });

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditModalOpen(false);
      setSelectedUserToEdit(null);

      // Refresh the list
      fetchUsers();

    } catch (error: any) {
      console.error("Update user error:", error);
      toast({
        title: "Error Updating User",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove auth user via edge function
  const removeUser = async () => {
    if (!selectedUserToDelete) {
      toast({
        title: "Error",
        description: "Please select a user to delete",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await callAuthFunction('delete', {
        userId: selectedUserToDelete
      });

      toast({
        title: "Success",
        description: "User deleted successfully - login access revoked",
      });

      setSelectedUserToDelete("");
      setIsRemoveModalOpen(false);

      // Refresh the list
      fetchUsers();

    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({
        title: "Error Deleting User",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit modal with user data
  const openEditModal = (user: UserData) => {
    setSelectedUserToEdit(user);
    setEditUserName(user.name || "");
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserProjectName(user.project_name || "");
    setIsEditModalOpen(true);
  };

  // Set up real-time subscription and initial data fetch
  useEffect(() => {
    // Initial fetch
    fetchUsers();

    // Set up real-time subscription to public.users table for sync
    const channel = supabase
      .channel('public:users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('Real-time change:', payload);
          // Refresh the list when changes occur
          fetchUsers();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-sm border-r p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">User Management</h2>
            <p className="text-sm text-gray-600">Manage user accounts with login credentials</p>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{userStats.totalUsers}</p>
                    <p className="text-xs text-blue-700">with login access</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Admins</p>
                    <p className="text-2xl font-bold text-green-600">{userStats.admins}</p>
                    <p className="text-xs text-green-700">admin users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Phone className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-900">Callers</p>
                    <p className="text-2xl font-bold text-purple-600">{userStats.callers}</p>
                    <p className="text-xs text-purple-700">caller users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={fetchUsers}
              disabled={isLoading}
              className="w-full bg-gray-600 hover:bg-gray-700" 
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Users
            </Button>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with login credentials.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password for login"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="caller">Caller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUserRole !== 'admin' && (
                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        type="text"
                        placeholder="Project name"
                        value={newUserProjectName}
                        onChange={(e) => setNewUserProjectName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={addUser}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user details and permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName">Full Name</Label>
                    <Input
                      id="editName"
                      type="text"
                      placeholder="John Doe"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEmail">Email</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      placeholder="user@example.com"
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRole">Role</Label>
                    <Select value={editUserRole} onValueChange={setEditUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="caller">Caller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editUserRole !== 'admin' && (
                    <div>
                      <Label htmlFor="editProjectName">Project Name</Label>
                      <Input
                        id="editProjectName"
                        type="text"
                        placeholder="Project name"
                        value={editUserProjectName}
                        onChange={(e) => setEditUserProjectName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={updateUser}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full" size="lg">
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Remove User</DialogTitle>
                  <DialogDescription>
                    Select a user to permanently delete and revoke login access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userSelect">Select User</Label>
                    <Select value={selectedUserToDelete} onValueChange={setSelectedUserToDelete}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user to delete" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.email} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={removeUser}
                    disabled={isLoading || !selectedUserToDelete}
                    variant="destructive"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Accounts with Login Access
              </CardTitle>
              <CardDescription>
                Manage user accounts that can log in to the system (Real-time sync enabled)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : users.length === 0 ? (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    No user accounts found. Create your first user with login credentials using the "Add New User" button.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USER</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead>PROJECT</TableHead>
                      <TableHead>LAST LOGIN</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.name || user.email.split('@')[0]}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === 'admin' ? "default" : "secondary"}
                            className={user.role === 'admin' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                          >
                            {user.role === 'admin' ? 'Admin' : 'Caller'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {user.project_name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500">
                            {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => openEditModal(user)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                setSelectedUserToDelete(user.id);
                                setIsRemoveModalOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};