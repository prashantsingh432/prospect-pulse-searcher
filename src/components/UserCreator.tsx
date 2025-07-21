
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
  role?: string;
  created_at: string;
  last_sign_in_at?: string;
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

  // Fetch users from Supabase using edge function
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching users using edge function...");

      const response = await supabase.functions.invoke('list-users');

      if (response.error) {
        console.error("Edge function error:", response.error);
        throw new Error(response.error.message || "Failed to fetch users");
      }

      console.log("Users fetched successfully:", response.data);

      if (response.data && response.data.users) {
        const userData = response.data.users.map((user: any) => ({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          user_metadata: user.user_metadata,
          role: user.user_metadata?.role || 'caller'
        }));

        setUsers(userData);

        // Calculate stats
        const stats = {
          totalUsers: userData.length,
          admins: userData.filter((u: any) => u.role === 'admin').length,
          callers: userData.filter((u: any) => u.role === 'caller').length
        };
        setUserStats(stats);

        toast({
          title: "Success",
          description: `Loaded ${userData.length} users successfully`,
        });
      }

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

  // Add new user using edge function
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
      console.log("Creating user:", newUserEmail, "with role:", newUserRole);

      const response = await supabase.functions.invoke('create-users', {
        body: {
          users: [{
            email: newUserEmail,
            password: newUserPassword,
            role: newUserRole
          }]
        },
      });

      if (response.error) {
        console.error("Create user error:", response.error);
        throw new Error(response.error.message || "Failed to create user");
      }

      console.log("User creation response:", response.data);

      if (response.data && response.data.results && response.data.results[0]?.success) {
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
      } else {
        throw new Error(response.data?.results?.[0]?.message || "Failed to create user");
      }

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

  // Remove user using edge function
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
      console.log("Deleting user:", selectedUserToDelete);

      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedUserToDelete },
      });

      if (response.error) {
        console.error("Delete user error:", response.error);
        throw new Error(response.error.message || "Failed to delete user");
      }

      console.log("User deletion response:", response.data);

      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });

        setSelectedUserToDelete("");
        setIsRemoveModalOpen(false);

        // Refresh user list
        fetchUsers();
      } else {
        throw new Error(response.data?.error || "Failed to delete user");
      }

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

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

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

          {/* Stats Cards */}
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{userStats.totalUsers}</p>
                    <p className="text-xs text-blue-700">registered users</p>
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
                    Create a new user account with email and password.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                        Creating...
                      </>
                    ) : (
                      "Create User"
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
                User List
              </CardTitle>
              <CardDescription>
                Showing all registered users in the system
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
                    No users found in the system. Create your first user using the "Add New User" button.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USER</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead>CREATED</TableHead>
                      <TableHead>LAST SIGN IN</TableHead>
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
                          <p className="text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                          </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
