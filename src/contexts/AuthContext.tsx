import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface User {
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // For demo purposes, we're using localStorage to persist login state
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock login function with hardcoded credentials
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    // Simple validation
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
    
    // Hardcoded authentication for specific user
    if (
      (email.toLowerCase() === "prashant@amplior.com" && password === "prsi@123Amp") ||
      (email.toLowerCase() === "prashant@admin.com" && password === "admin")
    ) {
      const user = { 
        email, 
        displayName: email.toLowerCase() === "prashant@admin.com" ? "Admin" : "AmpChamp" 
      };
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Show the welcome message
      toast({
        title: `Hi, ${user.displayName}! 👋`,
        description: "✅ You've signed in. Access granted.\nMake your best data day today — someone's success is just one call away.",
        duration: 6000,
      });
      
      setLoading(false);
      return true;
    }
    
    toast({
      title: "Authentication Failed",
      description: "Invalid email or password.",
      variant: "destructive",
    });
    setLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
