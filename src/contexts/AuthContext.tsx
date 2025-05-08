
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  email: string;
  displayName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isAdmin: () => boolean;
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

  useEffect(() => {
    // First check for existing session in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    
    // Then set up Supabase auth listener for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          checkUserRole(session.user.id, session.user.email || "");
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async (userId: string, email: string) => {
    // Try to get user role from users table
    const { data, error } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error("Error fetching user role:", error?.message);
      return;
    }
    
    const userWithRole = {
      email,
      displayName: data.name || email.split('@')[0],
      role: data.role
    };
    
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
  };

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
    
    try {
      // Try Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      });
      
      if (error) {
        // Fall back to hardcoded authentication for specific users
        if (
          (email.toLowerCase() === "prashant@amplior.com" && password === "prsi@123Amp") ||
          (email.toLowerCase() === "prashant@admin.com" && password === "admin")
        ) {
          const user = { 
            email, 
            displayName: email.toLowerCase() === "prashant@admin.com" ? "Admin" : "AmpChamp",
            role: email.toLowerCase() === "prashant@admin.com" ? "admin" : "caller"
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
        } else {
          toast({
            title: "Authentication Failed",
            description: error.message || "Invalid email or password.",
            variant: "destructive",
          });
          setLoading(false);
          return false;
        }
      }
      
      if (data.user) {
        await checkUserRole(data.user.id, data.user.email || email);
        
        // Show the welcome message
        const displayName = user?.displayName || email.split('@')[0];
        toast({
          title: `Hi, ${displayName}! 👋`,
          description: "✅ You've signed in. Access granted.\nMake your best data day today — someone's success is just one call away.",
          duration: 6000,
        });
        
        setLoading(false);
        return true;
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
    return false;
  };

  const logout = () => {
    supabase.auth.signOut().catch(console.error);
    localStorage.removeItem('user');
    setUser(null);
  };
  
  const isAdmin = () => {
    return user?.role === 'admin' || user?.email?.toLowerCase() === 'prashant@admin.com';
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
