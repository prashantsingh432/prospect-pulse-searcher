
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface User {
  email: string;
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
    
    // Mock authentication - in real app, this would verify against a backend
    if (email === "user@example.com" && password === "password") {
      const user = { email };
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setLoading(false);
      return true;
    }
    
    toast({
      title: "Authentication Failed",
      description: "Invalid email or password. Try user@example.com / password",
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
