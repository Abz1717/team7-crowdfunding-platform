"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/lib/auth";
import {
  getActivePitches,
  getPitchesByBusinessId,
  getAccountBalance,
  getInvestmentsByPitchId,
  getProfitDistributionsByPitchId,
} from "@/lib/data";
import type { Pitch } from "@/lib/types/pitch";
import type { Investment, ProfitDistribution } from "@/lib/types";
import type { User as UserType, BusinessUser } from "@/lib/types/user";
import type { Transaction } from "@/lib/types/transaction";
import {
  getCurrentUser,
  getCurrentBusinessUser,
  getTransactionHistory,
} from "@/lib/action";

// Pitch with investors
export interface PitchWithInvestors {
  pitch: Pitch;
  investors: Investment[];
  totalInvested: number;
}

// Profit distributions grouped by pitch
export interface PitchProfitDistributions {
  pitchId: string;
  distributions: ProfitDistribution[];
}

// Action types
type BusinessAction =
  | { type: "SET_MY_PITCHES"; payload: Pitch[] }
  | { type: "SET_OTHER_PITCHES"; payload: Pitch[] }
  | { type: "SET_MY_PITCHES_WITH_INVESTORS"; payload: PitchWithInvestors[] }
  | { type: "SET_ACCOUNT_BALANCE"; payload: number }
  | {
      type: "SET_USER_PROFILE";
      payload: { user: UserType | null; businessUser: BusinessUser | null };
    }
  | { type: "SET_PROFIT_DISTRIBUTIONS"; payload: PitchProfitDistributions[] }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "REFRESH_ALL" };

// State type
interface BusinessState {
  myPitches: Pitch[];
  otherPitches: Pitch[];
  myPitchesWithInvestors: PitchWithInvestors[];
  accountBalance: number;
  userProfile: UserType | null;
  businessUserProfile: BusinessUser | null;
  profitDistributions: PitchProfitDistributions[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

// Initial state
const initialState: BusinessState = {
  myPitches: [],
  otherPitches: [],
  myPitchesWithInvestors: [],
  accountBalance: 0,
  userProfile: null,
  businessUserProfile: null,
  profitDistributions: [],
  transactions: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Reducer
function businessReducer(
  state: BusinessState,
  action: BusinessAction
): BusinessState {
  switch (action.type) {
    case "SET_MY_PITCHES":
      return { ...state, myPitches: action.payload };
    case "SET_OTHER_PITCHES":
      return { ...state, otherPitches: action.payload };
    case "SET_MY_PITCHES_WITH_INVESTORS":
      return { ...state, myPitchesWithInvestors: action.payload };
    case "SET_ACCOUNT_BALANCE":
      return { ...state, accountBalance: action.payload };
    case "SET_USER_PROFILE":
      return {
        ...state,
        userProfile: action.payload.user,
        businessUserProfile: action.payload.businessUser,
      };
    case "SET_PROFIT_DISTRIBUTIONS":
      return { ...state, profitDistributions: action.payload };
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "REFRESH_ALL":
      return { ...state, lastFetched: new Date() };
    default:
      return state;
  }
}

// Context type
interface BusinessContextType extends BusinessState {
  dispatch: React.Dispatch<BusinessAction>;
  refreshAllData: () => Promise<void>;
  refreshMyPitches: () => Promise<void>;
  refreshOtherPitches: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshProfitDistributions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  getProfitDistributionsForPitch: (pitchId: string) => ProfitDistribution[];
}

// Create context
const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

// Provider component
interface BusinessProviderProps {
  children: ReactNode;
}

export function BusinessProvider({ children }: BusinessProviderProps) {
  const [state, dispatch] = useReducer(businessReducer, initialState);
  const { user } = useAuth();

  // Fetch user's own pitches with investor details
  const refreshMyPitches = useCallback(async () => {
    if (!user) return;

    try {
      // Get business user profile first
      const businessResult = await getCurrentBusinessUser();
      if (!businessResult.success || !businessResult.data) {
        console.error("No business user found");
        return;
      }

      const businessUserId = businessResult.data.id;

      // Fetch my pitches
      const pitches = await getPitchesByBusinessId(businessUserId);
      dispatch({ type: "SET_MY_PITCHES", payload: pitches });

      // Fetch investor details for each pitch
      const pitchesWithInvestors = await Promise.all(
        pitches.map(async (pitch) => {
          const investors = await getInvestmentsByPitchId(pitch.id);
          const totalInvested = investors.reduce(
            (sum, inv) => sum + inv.investment_amount,
            0
          );
          return { pitch, investors, totalInvested };
        })
      );

      dispatch({
        type: "SET_MY_PITCHES_WITH_INVESTORS",
        payload: pitchesWithInvestors,
      });
    } catch (error) {
      console.error("Error fetching my pitches:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch my pitches" });
    }
  }, [user]);

  // Fetch other active pitches (for browsing)
  const refreshOtherPitches = useCallback(async () => {
    if (!user) return;

    try {
      const allPitches = await getActivePitches();

      // Get business user profile to filter out own pitches
      const businessResult = await getCurrentBusinessUser();
      if (businessResult.success && businessResult.data) {
        const businessUserId = businessResult.data.id;
        // Filter out user's own pitches
        const otherPitches = allPitches.filter(
          (pitch) => pitch.business_id !== businessUserId
        );
        dispatch({ type: "SET_OTHER_PITCHES", payload: otherPitches });
      } else {
        dispatch({ type: "SET_OTHER_PITCHES", payload: allPitches });
      }
    } catch (error) {
      console.error("Error fetching other pitches:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to fetch other pitches",
      });
    }
  }, [user]);

  // Fetch user profile and settings
  const refreshUserProfile = useCallback(async () => {
    try {
      const userResult = await getCurrentUser();
      let businessUser: BusinessUser | null = null;
      let accountBalance = 0;

      if (userResult.success && userResult.data) {
        accountBalance = await getAccountBalance(userResult.data.id);

        if (userResult.data.account_type === "business") {
          const businessResult = await getCurrentBusinessUser();
          if (businessResult.success && businessResult.data) {
            businessUser = businessResult.data;
          }
        }

        dispatch({
          type: "SET_USER_PROFILE",
          payload: { user: userResult.data, businessUser },
        });
        dispatch({ type: "SET_ACCOUNT_BALANCE", payload: accountBalance });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch user profile" });
    }
  }, []);

  // Fetch profit distributions for all my pitches
  const refreshProfitDistributions = useCallback(async () => {
    if (!user) return;

    try {
      // Get business user profile first
      const businessResult = await getCurrentBusinessUser();
      if (!businessResult.success || !businessResult.data) {
        console.error("No business user found");
        return;
      }

      const businessUserId = businessResult.data.id;

      // Fetch my pitches
      const pitches = await getPitchesByBusinessId(businessUserId);

      console.log(
        "[BusinessContext] Fetching profit distributions for",
        pitches.length,
        "pitches"
      );

      // Fetch profit distributions for each pitch
      const allDistributions = await Promise.all(
        pitches.map(async (pitch) => {
          const distributions = await getProfitDistributionsByPitchId(pitch.id);
          console.log(
            `[BusinessContext] Pitch ${pitch.id}: ${
              distributions?.length || 0
            } distributions`
          );
          return {
            pitchId: pitch.id,
            distributions: distributions || [],
          };
        })
      );

      console.log(
        "[BusinessContext] Cached",
        allDistributions.length,
        "pitch profit distributions"
      );

      dispatch({
        type: "SET_PROFIT_DISTRIBUTIONS",
        payload: allDistributions,
      });
    } catch (error) {
      console.error("Error fetching profit distributions:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to fetch profit distributions",
      });
    }
  }, [user]);

  // Helper function to get distributions for a specific pitch
  const getProfitDistributionsForPitch = useCallback(
    (pitchId: string): ProfitDistribution[] => {
      const pitchDistributions = state.profitDistributions.find(
        (pd) => pd.pitchId === pitchId
      );
      return pitchDistributions?.distributions || [];
    },
    [state.profitDistributions]
  );

  // Fetch transaction history
  const refreshTransactions = useCallback(async () => {
    try {
      const result = await getTransactionHistory();
      if (result.success && result.data) {
        console.log(
          "[BusinessContext] Cached",
          result.data.length,
          "transactions"
        );
        dispatch({ type: "SET_TRANSACTIONS", payload: result.data });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to fetch transactions",
      });
    }
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      await Promise.all([
        refreshMyPitches(),
        refreshOtherPitches(),
        refreshUserProfile(),
        refreshProfitDistributions(),
        refreshTransactions(),
      ]);
      dispatch({ type: "REFRESH_ALL" });
    } catch (error) {
      console.error("Error refreshing all data:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to refresh data" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    refreshMyPitches,
    refreshOtherPitches,
    refreshUserProfile,
    refreshProfitDistributions,
    refreshTransactions,
  ]);

  // Initial data fetch when user logs in or component mounts
  useEffect(() => {
    if (user && user.role === "business") {
      console.log(
        "[BusinessContext] Fetching initial business data for user:",
        user.email
      );
      refreshAllData();
    }
  }, [user, refreshAllData]);

  return (
    <BusinessContext.Provider
      value={{
        ...state,
        dispatch,
        refreshAllData,
        refreshMyPitches,
        refreshOtherPitches,
        refreshUserProfile,
        refreshProfitDistributions,
        refreshTransactions,
        getProfitDistributionsForPitch,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

// Custom hook to use the business context
export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}

// Safe version that returns null instead of throwing
export function useBusinessSafe() {
  const context = useContext(BusinessContext);
  return context || null;
}
