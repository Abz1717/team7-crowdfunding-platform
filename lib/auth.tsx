"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "business" | "investor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchUserProfile = useCallback(
    async (supabaseUser: SupabaseUser) => {
      try {
        const { data, error } = await supabase
          .from("user")
          .select("first_name, last_name, account_type, created_at")
          .eq("email", supabaseUser.email)
          .single();

        if (error || !data) {
          console.error("Error fetching user profile:", error);
          setUser(null);
          return;
        }

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: `${data.first_name} ${data.last_name}`,
          role: data.account_type as UserRole,
          createdAt: new Date(data.created_at),
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      }
    },
    [supabase]
  );

  // Initial session and auth state changes
  useEffect(() => {
    let mounted = true;

    const getSessionAndListen = async () => {
      // Get initial session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        await fetchUserProfile(session.user);
      }
      setIsLoading(false);

      // Listen to auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    };

    getSessionAndListen();
  }, [fetchUserProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
 
  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
