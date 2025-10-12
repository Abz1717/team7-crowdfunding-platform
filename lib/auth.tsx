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
  funding_balance: number;
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

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser, retryCount = 0) => {
    try {
      console.log(
        "[AuthProvider] Fetching user profile for:",
        supabaseUser.email,
        "retry:",
        retryCount
      );

      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Use API route to fetch user details
      const response = await fetch("/api/user", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404 && retryCount < 3) {
          console.log(
            "[AuthProvider] User not found in database, retrying in 500ms:",
            supabaseUser.email,
            "attempt:",
            retryCount + 1
          );
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchUserProfile(supabaseUser, retryCount + 1);
        } else if (response.status === 404) {
          console.warn(
            "[AuthProvider] User not found in database after retries, signing out:",
            supabaseUser.email
          );
          await supabase.auth.signOut();
          setUser(null);
          return;
        }
        
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

      if (userData.role && userData.email) {
        const user: User = {
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
          funding_balance:
            typeof userData.funding_balance === "number"
              ? userData.funding_balance
              : 0,
        };
        console.log("[AuthProvider] User profile loaded:", user);
        setUser(user);
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
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Initial session and auth state changes
  useEffect(() => {
    //  initial session

    const getInitialSession = async () => {
      console.log("[AuthProvider] Getting initial session");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log("[AuthProvider] Session user found:", session.user.email);
          await fetchUserProfile(session.user);
        } else {
          console.log("[AuthProvider] No session user found");
          setIsLoading(false);
        }
        console.log("[AuthProvider] Session fetched");
      } catch (err) {
        console.error("[AuthProvider] Error in getInitialSession", err);
        setIsLoading(false);
      }
    };
    getInitialSession();

    // auth changes - server actions signup)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        `[AuthProvider] Auth state changed: ${event}`,
        session?.user?.email
      );
      try {
        if (session?.user) {
          setIsLoading(true);
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[AuthProvider] Error in onAuthStateChange", err);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // Add a window focus listener to refresh auth state when user returns to the page
  useEffect(() => {
    const handleFocus = async () => {
      console.log("Window focused, checking auth state");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchUserProfile, supabase]);

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
