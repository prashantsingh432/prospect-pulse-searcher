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
import type { Tables } from "@/integrations/supabase/types";

type UserData = Tables<'users'>;

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
  const [newUserRole, setNewUserRole] = useState("caller");
  const [newUserStatus, setNewUserStatus] = useState("active");

  // Edit user form state
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("caller");
  const [editUserStatus, setEditUserStatus] = useState("active");

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

  // Fetch users from Supabase users table
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const userData = data || [];
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

  // Add new user to Supabase users table
  const addUser = async () => {
    if (!newUserName || !newUserEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          status: newUserStatus,
          last_active: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `User ${newUserEmail} created successfully`,
      });

      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("caller");
      setNewUserStatus("active");
      setIsAddModalOpen(false);

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

  // Update existing user
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
      const { error } = await supabase
        .from('users')
        .update({
          name: editUserName,
          email: editUserEmail,
          role: editUserRole,
          status: editUserStatus,
        })
        .eq('id', selectedUserToEdit.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditModalOpen(false);
      setSelectedUserToEdit(null);

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

  // Remove user from Supabase users table
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
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUserToDelete);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setSelectedUserToDelete("");
      setIsRemoveModalOpen(false);

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
    setEditUserStatus(user.status || "active");
    setIsEditModalOpen(true);
  };

  // Set up real-time subscription and initial data fetch
  useEffect(() => {
    // Initial fetch
    fetchUsers();

    // Set up real-time subscription
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
          
          if (payload.eventType === 'INSERT') {
            const newUser = payload.new as UserData;
            setUsers(prev => {
              const updated = [newUser, ...prev];
              calculateStats(updated);
              return updated;
            });
            toast({
              title: "User Added",
              description: `${newUser.email} was added to the system`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedUser = payload.new as UserData;
            setUsers(prev => {
              const updated = prev.map(user => 
                user.id === updatedUser.id ? updatedUser : user
              );
              calculateStats(updated);
              return updated;
            });
            toast({
              title: "User Updated",
              description: `${updatedUser.email} was updated`,
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedUser = payload.old as UserData;
            setUsers(prev => {
              const updated = prev.filter(user => user.id !== deletedUser.id);
              calculateStats(updated);
              return updated;
            });
            toast({
              title: "User Removed",
              description: `${deletedUser.email} was removed from the system`,
            });
          }
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
                    Create a new user account with their details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Full Name"
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
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newUserStatus} onValueChange={setNewUserStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
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
                    <Label htmlFor="editName">Name</Label>
                    <Input
                      id="editName"
                      type="text"
                      placeholder="Full Name"
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
                  <div>
                    <Label htmlFor="editStatus">Status</Label>
                    <Select value={editUserStatus} onValueChange={setEditUserStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                Showing all registered users in the system (Live sync enabled)
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
                      <TableHead>STATUS</TableHead>
                      <TableHead>LAST ACTIVE</TableHead>
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
                          <Badge
                            variant={user.status === 'active' ? "default" : "secondary"}
                            className={user.status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {user.status || 'Active'}
                          </Badge>
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