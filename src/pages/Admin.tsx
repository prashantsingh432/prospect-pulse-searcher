
import React from "react";
import { Navbar } from "@/components/Navbar";
import { UserCreator } from "@/components/UserCreator";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { isAdmin } = useAuth();
  
  if (!isAdmin()) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <UserCreator />
      </div>
    </div>
  );
};

export default Admin;
