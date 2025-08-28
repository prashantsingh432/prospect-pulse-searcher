import React from "react";
import { Navbar } from "@/components/Navbar";
import { DataManagement as DataManagementComponent } from "@/components/DataManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const DataManagement = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-6">
        <DataManagementComponent />
      </div>
    </div>
  );
};

export default DataManagement;
