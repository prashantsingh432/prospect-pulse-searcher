import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Database, Settings } from "lucide-react";
export const Navbar = () => {
  const {
    logout,
    isAdmin,
    user
  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return <nav className="bg-white shadow-sm border-b">
      <div className="container flex justify-between items-center mx-auto py-[10px] px-[16px]">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <img src="/lovable-uploads/4ffa38c9-418b-49d3-8fd5-2838eb38f484.png" alt="AltLeads Logo" className="w-[110px] h-auto" />
            <h1 className="text-xl font-bold text-[#0000ff]">Prospect Finder</h1>
          </Link>
          
          {/* Project Name Display */}
          {user?.projectName && <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-600">🔹</span>
              <span className="text-sm font-medium text-blue-700">
                Project: {user.projectName}
              </span>
            </div>}
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin() && (
            <>
              <Button variant="outline" asChild>
                <Link to="/admin" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
              <Button variant="default" asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to="/data-management" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Management
                </Link>
              </Button>
            </>
          )}
          
          {/* User Name Display */}
          {user?.fullName && <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-600">👤</span>
              <span className="text-sm font-medium text-green-700 hidden md:inline-block">
                {user.fullName}
              </span>
            </div>}
          
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>;
};