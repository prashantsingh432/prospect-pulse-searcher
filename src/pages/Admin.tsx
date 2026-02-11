
import React from "react";
import { Navbar } from "@/components/Navbar";
import { UserCreator } from "@/components/UserCreator";
import { LushaApiManager } from "@/components/LushaApiManager";
import { ProjectManager } from "@/components/ProjectManager";
import { SimInventoryManager } from "@/components/sim/SimInventoryManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="lusha">Lusha API Manager</TabsTrigger>
            <TabsTrigger value="sim">SIM Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserCreator />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectManager />
          </TabsContent>

          <TabsContent value="lusha" className="mt-6">
            <LushaApiManager />
          </TabsContent>

          <TabsContent value="sim" className="mt-6">
            <SimInventoryManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
