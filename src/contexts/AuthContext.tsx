
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  projectName?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Convert Supabase user to our AuthUser format
  const createAuthUser = (supabaseUser: User): AuthUser => {
    const metadata = supabaseUser.user_metadata || {};
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName: metadata.full_name || supabaseUser.email?.split('@')[0] || '',
      projectName: metadata.project_name || '',
      role: metadata.project_name === 'ADMIN' ? 'admin' : 'caller'
    };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ? createAuthUser(session.user) : null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ? createAuthUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
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
      // Use Supabase Auth for login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (error) {
        console.error("Supabase authentication error:", error.message);
        
        toast({
          title: "Authentication Failed",
          description: "Invalid email or password. Please check your credentials and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }
      
      if (data.user && data.session) {
        const authUser = createAuthUser(data.user);
        setUser(authUser);
        setSession(data.session);
        
        toast({
          title: `Welcome back, ${authUser.fullName}! 👋`,
          description: `✅ Signed in successfully.\n🔹 Project: ${authUser.projectName}`,
          duration: 6000,
        });
        
        setLoading(false);
        return true;
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };
  
  const isAdmin = () => {
    return user?.role === 'admin' || user?.projectName === 'ADMIN';
  };

  const value = {
    user,
    session,
    login,
    logout,
    loading,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
