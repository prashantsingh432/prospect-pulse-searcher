
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

export const Navbar = () => {
  const { logout, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/4ffa38c9-418b-49d3-8fd5-2838eb38f484.png" 
              alt="AltLeads Logo" 
              className="h-20 w-auto"
            />
            <h1 className="text-xl font-bold text-[#0000ff]">Prospect Finder</h1>
          </div>
          
          {/* Project Name Display */}
          {user?.projectName && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-600">🔹</span>
              <span className="text-sm font-medium text-blue-700">
                Project: {user.projectName}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin() && (
            <Button variant="outline" asChild>
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          
          {/* User Name Display */}
          {user?.fullName && (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-600">👤</span>
              <span className="text-sm font-medium text-green-700 hidden md:inline-block">
                {user.fullName}
              </span>
            </div>
          )}
          
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};
