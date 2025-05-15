import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
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
  return <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#0000ff]">Prospect Pulse- Amplior</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin() && <Button variant="outline" asChild>
              <Link to="/admin">Admin</Link>
            </Button>}
          
          <span className="text-sm text-gray-600 hidden md:inline-block">
            {user?.displayName || user?.email}
          </span>
          
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>;
};