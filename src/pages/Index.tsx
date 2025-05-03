
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  // Redirect to dashboard on load
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Prospect Pulse</h1>
        <p className="text-xl text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
