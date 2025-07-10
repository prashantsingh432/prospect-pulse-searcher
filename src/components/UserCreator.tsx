
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
import { Loader2, Users, UserPlus, UserMinus, Shield, Phone, Trash2, Edit } from "lucide-react";

type UserData = {
  id: string;
  email: string;
  role?: string;
  created_at: string;
  user_metadata?: {
    role?: string;
    project_name?: string;
    full_name?: string;
  };
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
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<string>("");

  // Add user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("caller");

  const { toast } = useToast();

  // Fetch users from Supabase
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log("Attempting to fetch users...");

      // First, try the admin API
      const { data, error } = await supabase.auth.admin.listUsers();

      if (error) {
        console.error("Admin API error:", error);

        // If admin API fails, show detailed error and try alternative approach
        if (error.message.includes('service_role') || error.message.includes('admin') || error.message.includes('permission')) {
          toast({
            title: "Admin API Access Required",
            description: "Using service role key is required for user management. Trying alternative approach...",
            variant: "destructive",
          });

          // Try alternative approach using edge function or RPC
          await fetchUsersAlternative();
          return;
        }

        throw error;
      }

      console.log("Successfully fetched users:", data.users.length);

      const userData = data.users.map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        user_metadata: user.user_metadata,
        role: user.user_metadata?.role || (user.user_metadata?.project_name === 'ADMIN' ? 'admin' : 'caller')
      }));

      setUsers(userData);

      // Calculate stats
      const stats = {
        totalUsers: userData.length,
        admins: userData.filter(u => u.role === 'admin' || u.user_metadata?.project_name === 'ADMIN').length,
        callers: userData.filter(u => u.role === 'caller' || (u.user_metadata?.project_name !== 'ADMIN' && u.role !== 'admin')).length
      };
      setUserStats(stats);

    } catch (error: any) {
      console.error("Fetch users error:", error);
      toast({
        title: "Error Fetching Users",
        description: `${error.message || "Failed to fetch users"}. Please check console for details.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative approach using edge function
  const fetchUsersAlternative = async () => {
    try {
      console.log("Trying alternative user fetch method...");

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      // Try to call an edge function that can list users with service role
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://lodpoepylygsryjdkqjg.supabase.co"}/functions/v1/list-users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        // If edge function doesn't exist, create mock data for demonstration
        console.log("Edge function not available, creating demo data...");
        createDemoUsers();
        return;
      }

      const data = await response.json();

      if (data.users) {
        const userData = data.users.map((user: any) => ({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          user_metadata: user.user_metadata,
          role: user.user_metadata?.role || (user.user_metadata?.project_name === 'ADMIN' ? 'admin' : 'caller')
        }));

        setUsers(userData);

        const stats = {
          totalUsers: userData.length,
          admins: userData.filter((u: any) => u.role === 'admin' || u.user_metadata?.project_name === 'ADMIN').length,
          callers: userData.filter((u: any) => u.role === 'caller' || (u.user_metadata?.project_name !== 'ADMIN' && u.role !== 'admin')).length
        };
        setUserStats(stats);
      }

    } catch (error: any) {
      console.error("Alternative fetch failed:", error);
      createDemoUsers();
    }
  };

  // Create demo users for demonstration when API is not available
  const createDemoUsers = () => {
    console.log("Creating demo users for demonstration...");

    const demoUsers = [
      {
        id: "demo-1",
        email: "admin@example.com",
        created_at: new Date().toISOString(),
        user_metadata: { role: "admin", project_name: "ADMIN", full_name: "Admin User" },
        role: "admin"
      },
      {
        id: "demo-2",
        email: "caller1@example.com",
        created_at: new Date().toISOString(),
        user_metadata: { role: "caller", project_name: "CALLER", full_name: "Caller One" },
        role: "caller"
      },
      {
        id: "demo-3",
        email: "caller2@example.com",
        created_at: new Date().toISOString(),
        user_metadata: { role: "caller", project_name: "CALLER", full_name: "Caller Two" },
        role: "caller"
      }
    ];

    // Add your actual users if you know them
    const actualUsers = [
      "arnab.hungerbox@amplior.com",
      "ayush.hungerbox@amplior.com",
      "kushi.hungerbox@amplior.com",
      "Anushka.hungerbox@amplior.com",
      "mahak.hungerbox@amplior.com",
      "Ankita.dc@amplior.com",
      "rishita.dc@amplior.com",
      "vandita.dc@amplior.com",
      "shivam.datateam@amplior.com"
    ].map((email, index) => ({
      id: `actual-${index}`,
      email,
      created_at: new Date().toISOString(),
      user_metadata: { role: "caller", project_name: "CALLER", full_name: email.split('@')[0] },
      role: "caller"
    }));

    const allUsers = [...demoUsers, ...actualUsers];
    setUsers(allUsers);

    const stats = {
      totalUsers: allUsers.length,
      admins: allUsers.filter(u => u.role === 'admin').length,
      callers: allUsers.filter(u => u.role === 'caller').length
    };
    setUserStats(stats);

    toast({
      title: "Demo Mode",
      description: `Showing ${allUsers.length} users in demo mode. To see real users, configure Supabase service role key.`,
      variant: "default",
    });
  };

  // Add new user
  const addUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting to create user:", newUserEmail);

      // Try admin API first
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        user_metadata: {
          role: newUserRole,
          project_name: newUserRole === 'admin' ? 'ADMIN' : 'CALLER'
        }
      });

      if (error) {
        console.error("Admin create user error:", error);

        // If admin API fails due to permissions, try edge function
        if (error.message.includes('service_role') || error.message.includes('admin') || error.message.includes('permission')) {
          await addUserAlternative();
          return;
        }

        throw error;
      }

      console.log("User created successfully:", data);

      toast({
        title: "Success",
        description: `User ${newUserEmail} created successfully`,
      });

      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("caller");
      setIsAddModalOpen(false);

      // Refresh user list
      fetchUsers();

    } catch (error: any) {
      console.error("Create user error:", error);
      toast({
        title: "Error Creating User",
        description: `${error.message || "Failed to create user"}. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative user creation using edge function
  const addUserAlternative = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://lodpoepylygsryjdkqjg.supabase.co"}/functions/v1/create-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            users: [{
              email: newUserEmail,
              password: newUserPassword
            }]
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Edge function error:", errorText);
        throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Edge function response:", data);

      if (data.results && data.results[0]?.success) {
        toast({
          title: "Success",
          description: `User ${newUserEmail} created successfully via edge function`,
        });

        // Reset form
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("caller");
        setIsAddModalOpen(false);

        // Refresh user list
        fetchUsers();
      } else {
        throw new Error(data.results?.[0]?.message || "Failed to create user");
      }

    } catch (error: any) {
      console.error("Alternative create user failed:", error);
      toast({
        title: "User Creation Failed",
        description: `${error.message}. Check if Supabase edge functions are deployed.`,
        variant: "destructive",
      });
    }
  };

  // Remove user
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
      console.log("Attempting to delete user:", selectedUserToDelete);

      // Check if this is a demo user
      if (selectedUserToDelete.startsWith('demo-') || selectedUserToDelete.startsWith('actual-')) {
        // Remove from demo list
        setUsers(prev => prev.filter(u => u.id !== selectedUserToDelete));

        // Recalculate stats
        const updatedUsers = users.filter(u => u.id !== selectedUserToDelete);
        const stats = {
          totalUsers: updatedUsers.length,
          admins: updatedUsers.filter(u => u.role === 'admin').length,
          callers: updatedUsers.filter(u => u.role === 'caller').length
        };
        setUserStats(stats);

        toast({
          title: "Success",
          description: "Demo user removed successfully",
        });

        setSelectedUserToDelete("");
        setIsRemoveModalOpen(false);
        return;
      }

      // Try admin API for real users
      const { error } = await supabase.auth.admin.deleteUser(selectedUserToDelete);

      if (error) {
        console.error("Admin delete user error:", error);

        if (error.message.includes('service_role') || error.message.includes('admin') || error.message.includes('permission')) {
          // Try edge function as fallback
          await removeUserAlternative();
          return;
        }

        throw error;
      }

      console.log("User deleted successfully");

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setSelectedUserToDelete("");
      setIsRemoveModalOpen(false);

      // Refresh user list
      fetchUsers();

    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({
        title: "Error Deleting User",
        description: `${error.message || "Failed to delete user"}. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative user deletion using edge function
  const removeUserAlternative = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://lodpoepylygsryjdkqjg.supabase.co"}/functions/v1/delete-user`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: selectedUserToDelete }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete edge function error:", errorText);
        throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Delete edge function response:", data);

      if (data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully via edge function",
        });

        setSelectedUserToDelete("");
        setIsRemoveModalOpen(false);

        // Refresh user list
        fetchUsers();
      } else {
        throw new Error(data.error || "Failed to delete user");
      }

    } catch (error: any) {
      console.error("Alternative delete user failed:", error);
      toast({
        title: "User Deletion Failed",
        description: `${error.message}. Check if Supabase edge functions are deployed.`,
        variant: "destructive",
      });
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Check if we're in demo mode
  const isDemoMode = users.length > 0 && (users[0].id.startsWith('demo-') || users[0].id.startsWith('actual-'));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-sm border-r p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">User Management</h2>
            <p className="text-sm text-gray-600">Manage users and their roles</p>
          </div>

          {isDemoMode && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800 text-xs">
                <p className="font-semibold">Demo Mode Active</p>
                <p>Showing sample data. For real user management, configure Supabase service role key.</p>
              </AlertDescription>
            </Alert>
          )}

          {!isDemoMode && userStats.totalUsers === 0 && !isLoading && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-xs">
                <p className="font-semibold">No Users Found</p>
                <p>Either no users exist or admin access is required. Check browser console for details.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{userStats.totalUsers}</p>
                    <p className="text-xs text-blue-700">appears in {userStats.totalUsers} records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Admins Count</p>
                    <p className="text-2xl font-bold text-green-600">{userStats.admins}</p>
                    <p className="text-xs text-green-700">appears in {userStats.admins} records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Phone className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-900">Callers Count</p>
                    <p className="text-2xl font-bold text-purple-600">{userStats.callers}</p>
                    <p className="text-xs text-purple-700">appears in {userStats.callers} records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
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
                    Create a new user account with specified role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@email.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
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
                        Adding...
                      </>
                    ) : (
                      "Add User"
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
                    Select a user to permanently delete from the system.
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
                      "Delete Selected User"
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
                User List
              </CardTitle>
              <CardDescription>
                Showing 1-{Math.min(10, users.length)} of {users.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USER</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.slice(0, 10).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.user_metadata?.full_name || user.email.split('@')[0]}
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
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
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

              {users.length > 10 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing 1-10 of {users.length}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
                      1
                    </Button>
                    <Button variant="outline" size="sm">
                      2
                    </Button>
                    <Button variant="outline" size="sm">
                      3
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
