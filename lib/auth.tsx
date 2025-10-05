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
  account_balance: number;
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

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      console.log(
        "[AuthProvider] Fetching user profile for:",
        supabaseUser.email
      );

      // Use API route to fetch user details (single source of truth)
      const response = await fetch("/api/user", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error(
          "[AuthProvider] Error fetching user profile from API:",
          response.status,
          "for email:",
          supabaseUser.email
        );
        setUser(null);
        return;
      }

      const userData = await response.json();

      if (userData && userData.role && userData.email) {
        const loadedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name:
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
            supabaseUser.email!,
          role: userData.role as UserRole,
          createdAt: new Date(userData.created_at),
          account_balance:
            typeof userData.account_balance === "number"
              ? userData.account_balance
              : 0,
        };
        console.log("[AuthProvider] User profile loaded:", loadedUser);
        setUser(loadedUser);
      } else {
        console.error(
          "[AuthProvider] No user data found in API response for email:",
          supabaseUser.email
        );
        setUser(null);
      }
    } catch (error) {
      console.error(
        "[AuthProvider] Exception fetching user profile:",
        error,
        "for email:",
        supabaseUser.email
      );
      setUser(null);
    }
  }, []);

  // Initial session and auth state changes
  useEffect(() => {
    let mounted = true;

    const getSessionAndListen = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          await fetchUserProfile(session.user);
        }
      } catch (err) {
        console.error("[AuthProvider] Error getting initial session", err);
      } finally {
        setIsLoading(false);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        try {
          if (session?.user) {
            await fetchUserProfile(session.user);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("[AuthProvider] Error in onAuthStateChange", err);
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
