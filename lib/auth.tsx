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

  const fetchUserProfile = useCallback(
    async (supabaseUser: SupabaseUser) => {
      try {
        console.log("[AuthProvider] Fetching user profile for:", supabaseUser.email);
        const { data, error } = await supabase
          .from("user")
          .select("first_name, last_name, account_type, created_at, account_balance")
          .eq("email", supabaseUser.email)
          .single();

        if (error) {
          console.error("[AuthProvider] Error fetching user profile from DB:", error, "for email:", supabaseUser.email);
          setUser(null);
          return;
        }

        if (data) {
          const user: User = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: `${data.first_name} ${data.last_name}`,
            role: data.account_type as UserRole,
            createdAt: new Date(data.created_at),
            account_balance: typeof data.account_balance === 'number' ? data.account_balance : 0,
          };
          console.log("[AuthProvider] User profile loaded:", user);
          setUser(user);
        } else {
          console.error("[AuthProvider] No user data found in DB for email:", supabaseUser.email);
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthProvider] Exception fetching user profile:", error, "for email:", supabaseUser.email);
        setUser(null);
      }
    },
    [supabase]
  );

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
        }
        console.log("[AuthProvider] Session fetched");
      } catch (err) {
        console.error("[AuthProvider] Error in getInitialSession", err);
      } finally {
        setIsLoading(false);
      }
    };
    getInitialSession();

    // auth changes - server actions signup)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] Auth state changed: ${event}`, session?.user?.email);
      try {
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[AuthProvider] Error in onAuthStateChange", err);
      } finally {
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
      if (session?.user && !user) {
        console.log("Found session on focus, fetching profile");
        await fetchUserProfile(session.user);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchUserProfile, user]);

  // Check for refresh parameter and force session check
  useEffect(() => {
    const checkRefreshParam = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("refresh") === "true") {
        console.log("Refresh parameter detected, checking session");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("Found session after refresh, fetching profile");
          await fetchUserProfile(session.user);
        }
        // Remove the refresh parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("refresh");
        window.history.replaceState({}, "", newUrl.toString());
      }
    };

    checkRefreshParam();
  }, [fetchUserProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Refresh user profile from DB
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
