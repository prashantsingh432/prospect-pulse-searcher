import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { SimInventoryManager } from "@/components/sim/SimInventoryManager";

const SimInventory: React.FC = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <SimInventoryManager />
      </main>
    </div>
  );
};

export default SimInventory;
