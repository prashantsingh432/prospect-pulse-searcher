
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
      <UserCreator />
    </div>
  );
};

export default Admin;
