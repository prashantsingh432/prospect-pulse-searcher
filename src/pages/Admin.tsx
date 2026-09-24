
import React from "react";
import { Navbar } from "@/components/Navbar";
import { UserCreator } from "@/components/UserCreator";
import { LushaApiManager } from "@/components/LushaApiManager";
import { BetterContactApiManager } from "@/components/BetterContactApiManager";
import { ProjectManager } from "@/components/ProjectManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  // Sub-admins see: User Management, Projects, SIM Inventory
  // Super admins also see the external enrichment provider managers.
  const showLusha = isSuperAdmin();
  const showBetterContact = isSuperAdmin();
  const tabGridClass = showLusha && showBetterContact ? "grid-cols-5" : "grid-cols-3";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="users" className="w-full" onValueChange={(val) => {
          if (val === "sim") {
            navigate("/sim-inventory");
          }
        }}>
          <TabsList className={`grid w-full ${tabGridClass}`}>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            {showLusha && <TabsTrigger value="lusha">Lusha API Manager</TabsTrigger>}
            {showBetterContact && <TabsTrigger value="bettercontact">BetterContact API</TabsTrigger>}
            <TabsTrigger value="sim">SIM Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserCreator />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectManager />
          </TabsContent>

          {showLusha && (
            <TabsContent value="lusha" className="mt-6">
              <LushaApiManager />
            </TabsContent>
          )}

          {showBetterContact && (
            <TabsContent value="bettercontact" className="mt-6">
              <BetterContactApiManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
