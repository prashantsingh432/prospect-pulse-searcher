import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { DataManagement as DataManagementComponent } from "@/components/DataManagement";
import { CsvEnrichTool } from "@/components/CsvEnrichTool";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, Sparkles } from "lucide-react";

type View = "data" | "csv";

const DataManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [view, setView] = useState<View>("data");

  if (!isSuperAdmin()) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex gap-2">
          <Button
            variant={view === "data" ? "default" : "outline"}
            onClick={() => setView("data")}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            Data Management
          </Button>
          <Button
            variant={view === "csv" ? "default" : "outline"}
            onClick={() => setView("csv")}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            CSV LinkedIn Enrichment
          </Button>
        </div>

        {view === "data" ? <DataManagementComponent /> : <CsvEnrichTool />}
      </div>
    </div>
  );
};

export default DataManagement;
