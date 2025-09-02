
import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { UserCreator } from "@/components/UserCreator";
import { AdminDispositionManager } from "@/components/AdminDispositionManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Admin = () => {
  const { isAdmin } = useAuth();
  const [prospectId, setProspectId] = useState<string>("");
  const [showDispositionManager, setShowDispositionManager] = useState(false);

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  const handleManageDispositions = () => {
    const id = parseInt(prospectId);
    if (!id || isNaN(id)) {
      return;
    }
    setShowDispositionManager(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <UserCreator />
        
        {/* Disposition Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Disposition Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="prospectId" className="block text-sm font-medium mb-2">
                  Prospect ID
                </label>
                <Input
                  id="prospectId"
                  type="number"
                  placeholder="Enter prospect ID to manage dispositions..."
                  value={prospectId}
                  onChange={(e) => setProspectId(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleManageDispositions}
                disabled={!prospectId || isNaN(parseInt(prospectId))}
                className="flex items-center gap-2"
              >
                <Search size={16} />
                Manage Dispositions
              </Button>
            </div>
            
            {showDispositionManager && prospectId && (
              <AdminDispositionManager 
                prospectId={parseInt(prospectId)}
                onDispositionChange={() => {
                  // Refresh handled internally by AdminDispositionManager
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
