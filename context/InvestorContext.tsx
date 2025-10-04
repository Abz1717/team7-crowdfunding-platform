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
  getInvestmentsByInvestorId,
  getTotalInvested,
  getTotalReturns,
  getOverallROI,
  getAccountBalance,
  getPitchById,
  getProfitDistributionsByPitchId,
  getInvestorPayoutsByDistributionId,
  getInvestmentsByPitchId,
} from "@/lib/data";
import type {
  Pitch,
  Investment,
  ProfitDistribution,
  InvestorPayout,
} from "@/lib/types";
import type { User as UserType, BusinessUser } from "@/lib/types/user";
import type { Transaction } from "@/lib/types/transaction";
import {
  getCurrentUser,
  getCurrentBusinessUser,
  getTransactionHistory,
} from "@/lib/action";

// Investment details with pitch and returns
export interface InvestmentDetail {
  investment: Investment;
  pitch: Pitch | null;
  investmentReturns: number;
  roi: number;
}

// Profit payout with distribution info
export interface ProfitPayoutDetail {
  distribution: ProfitDistribution;
  pitch: Pitch | null;
  totalAmount: number;
  userSharePercent: number;
}

// Action types
type InvestorAction =
  | { type: "SET_PITCHES"; payload: Pitch[] }
  | { type: "SET_INVESTMENTS"; payload: Investment[] }
  | { type: "SET_INVESTMENT_DETAILS"; payload: InvestmentDetail[] }
  | { type: "SET_PROFIT_PAYOUTS"; payload: ProfitPayoutDetail[] }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "SET_ACCOUNT_BALANCE"; payload: number }
  | { type: "SET_TOTAL_INVESTED"; payload: number }
  | { type: "SET_TOTAL_RETURNS"; payload: number }
  | { type: "SET_OVERALL_ROI"; payload: number }
  | {
      type: "SET_USER_PROFILE";
      payload: { user: UserType | null; businessUser: BusinessUser | null };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "REFRESH_ALL" };

// State type
interface InvestorState {
  pitches: Pitch[];
  investments: Investment[];
  investmentDetails: InvestmentDetail[];
  profitPayouts: ProfitPayoutDetail[];
  transactions: Transaction[];
  accountBalance: number;
  totalInvested: number;
  totalReturns: number;
  overallROI: number;
  userProfile: UserType | null;
  businessUserProfile: BusinessUser | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

// Initial state
const initialState: InvestorState = {
  pitches: [],
  investments: [],
  investmentDetails: [],
  profitPayouts: [],
  transactions: [],
  accountBalance: 0,
  totalInvested: 0,
  totalReturns: 0,
  overallROI: 0,
  userProfile: null,
  businessUserProfile: null,
  loading: false,
  error: null,
  lastFetched: null,
};

// Reducer
function investorReducer(
  state: InvestorState,
  action: InvestorAction
): InvestorState {
  switch (action.type) {
    case "SET_PITCHES":
      return { ...state, pitches: action.payload };
    case "SET_INVESTMENTS":
      return { ...state, investments: action.payload };
    case "SET_INVESTMENT_DETAILS":
      return { ...state, investmentDetails: action.payload };
    case "SET_PROFIT_PAYOUTS":
      return { ...state, profitPayouts: action.payload };
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload };
    case "SET_ACCOUNT_BALANCE":
      return { ...state, accountBalance: action.payload };
    case "SET_TOTAL_INVESTED":
      return { ...state, totalInvested: action.payload };
    case "SET_TOTAL_RETURNS":
      return { ...state, totalReturns: action.payload };
    case "SET_OVERALL_ROI":
      return { ...state, overallROI: action.payload };
    case "SET_USER_PROFILE":
      return {
        ...state,
        userProfile: action.payload.user,
        businessUserProfile: action.payload.businessUser,
      };
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
interface InvestorContextType extends InvestorState {
  dispatch: React.Dispatch<InvestorAction>;
  refreshAllData: () => Promise<void>;
  refreshPitches: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

// Create context
const InvestorContext = createContext<InvestorContextType | undefined>(
  undefined
);

// Provider component
interface InvestorProviderProps {
  children: ReactNode;
}

export function InvestorProvider({ children }: InvestorProviderProps) {
  const [state, dispatch] = useReducer(investorReducer, initialState);
  const { user } = useAuth();

  // Fetch all pitches
  const refreshPitches = useCallback(async () => {
    try {
      const pitches = await getActivePitches();
      dispatch({ type: "SET_PITCHES", payload: pitches });
    } catch (error) {
      console.error("Error fetching pitches:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch pitches" });
    }
  }, []);

  // Fetch portfolio data (investments, balances, ROI)
  const refreshPortfolio = useCallback(async () => {
    if (!user) return;

    try {
      const [
        investments,
        accountBalance,
        totalInvested,
        totalReturns,
        overallROI,
      ] = await Promise.all([
        getInvestmentsByInvestorId(user.id),
        getAccountBalance(user.id),
        getTotalInvested(user.id),
        getTotalReturns(user.id),
        getOverallROI(user.id),
      ]);

      dispatch({ type: "SET_INVESTMENTS", payload: investments });
      dispatch({ type: "SET_ACCOUNT_BALANCE", payload: accountBalance });
      dispatch({ type: "SET_TOTAL_INVESTED", payload: totalInvested });
      dispatch({ type: "SET_TOTAL_RETURNS", payload: totalReturns });
      dispatch({ type: "SET_OVERALL_ROI", payload: overallROI });

      // Fetch detailed investment data with pitch info and returns
      if (investments.length > 0) {
        const details = await Promise.all(
          investments.map(async (investment: Investment) => {
            const pitch = await getPitchById(investment.pitch_id);
            const distributions = await getProfitDistributionsByPitchId(
              investment.pitch_id
            );

            // Get all investments by this investor in this pitch
            const allMyInvestments = investments.filter(
              (inv) =>
                inv.pitch_id === investment.pitch_id &&
                inv.investor_id === investment.investor_id
            );

            // Sum effective shares for this investor in this pitch
            const totalEffectiveShare = allMyInvestments.reduce(
              (sum, inv) =>
                sum +
                (typeof inv.effective_share === "number"
                  ? inv.effective_share
                  : 0),
              0
            );

            // Sum all payouts for this investor in this pitch across all distributions
            let totalPayout = 0;
            for (const dist of distributions) {
              const payouts = await getInvestorPayoutsByDistributionId(dist.id);
              payouts.forEach((payout) => {
                if (payout.investor_id === user.id)
                  totalPayout += payout.amount;
              });
            }

            // Proportional payout for this investment
            const thisShare =
              typeof investment.effective_share === "number"
                ? investment.effective_share
                : 0;
            const investmentReturns =
              totalEffectiveShare > 0
                ? totalPayout * (thisShare / totalEffectiveShare)
                : 0;
            const roi =
              investment.investment_amount > 0
                ? (investmentReturns / investment.investment_amount) * 100
                : 0;

            return { investment, pitch, investmentReturns, roi };
          })
        );
        dispatch({ type: "SET_INVESTMENT_DETAILS", payload: details });

        // Fetch profit payouts
        const allPitchIds = [
          ...new Set(investments.map((inv) => inv.pitch_id)),
        ];
        let payoutsArr: any[] = [];

        for (const pitchId of allPitchIds) {
          const pitch = await getPitchById(pitchId);
          const distributions = await getProfitDistributionsByPitchId(pitchId);

          for (const dist of distributions) {
            const payouts = await getInvestorPayoutsByDistributionId(dist.id);
            const myPayouts = payouts.filter((p) => p.investor_id === user.id);

            for (const payout of myPayouts) {
              payoutsArr.push({ payout, distribution: dist, pitch });
            }
          }
        }

        // Group by pitch-distribution and sum all payouts for the investor
        const grouped: Record<
          string,
          {
            distribution: ProfitDistribution;
            pitch: Pitch | null;
            totalAmount: number;
            userSharePercent: number;
          }
        > = {};

        for (const item of payoutsArr) {
          const key = `${item.pitch.id}-${item.distribution.id}`;
          if (!grouped[key]) {
            grouped[key] = {
              distribution: item.distribution,
              pitch: item.pitch,
              totalAmount: 0,
              userSharePercent: 0,
            };
          }
          grouped[key].totalAmount += item.payout.amount;
        }

        // Calculate the correct percentage for each group
        Object.values(grouped).forEach((group) => {
          const totalProfit = group.distribution.total_profit || 0;
          group.userSharePercent =
            totalProfit > 0 ? (group.totalAmount / totalProfit) * 100 : 0;
        });

        const groupedArr = Object.values(grouped).sort(
          (a, b) =>
            new Date(b.distribution.distribution_date).getTime() -
            new Date(a.distribution.distribution_date).getTime()
        );

        dispatch({ type: "SET_PROFIT_PAYOUTS", payload: groupedArr });
      } else {
        dispatch({ type: "SET_INVESTMENT_DETAILS", payload: [] });
        dispatch({ type: "SET_PROFIT_PAYOUTS", payload: [] });
      }
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to fetch portfolio data",
      });
    }
  }, [user]);

  // Fetch user profile and settings
  const refreshUserProfile = useCallback(async () => {
    try {
      const userResult = await getCurrentUser();
      let businessUser: BusinessUser | null = null;

      if (userResult.success && userResult.data) {
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
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch user profile" });
    }
  }, []);

  // Fetch transaction history
  const refreshTransactions = useCallback(async () => {
    try {
      const result = await getTransactionHistory();
      if (result.success && result.data) {
        console.log(
          "[InvestorContext] Cached",
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
        refreshPitches(),
        refreshPortfolio(),
        refreshUserProfile(),
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
    refreshPitches,
    refreshPortfolio,
    refreshUserProfile,
    refreshTransactions,
  ]);

  // Initial data fetch when user logs in or component mounts
  useEffect(() => {
    if (user && user.role === "investor") {
      // Only fetch if we don't already have data for this user
      if (state.pitches.length === 0 && state.investments.length === 0) {
        console.log(
          "[InvestorContext] Fetching initial investor data for user:",
          user.email
        );
        refreshAllData();
      } else {
        console.log(
          "[InvestorContext] Data already loaded for user:",
          user.email,
          "- skipping initial fetch"
        );
      }
    }
  }, [user, refreshAllData, state.pitches.length, state.investments.length]);

  return (
    <InvestorContext.Provider
      value={{
        ...state,
        dispatch,
        refreshAllData,
        refreshPitches,
        refreshPortfolio,
        refreshUserProfile,
        refreshTransactions,
      }}
    >
      {children}
    </InvestorContext.Provider>
  );
}

// Custom hook to use the investor context
export function useInvestor() {
  const context = useContext(InvestorContext);
  if (context === undefined) {
    throw new Error("useInvestor must be used within an InvestorProvider");
  }
  return context;
}

// Safe version that returns null instead of throwing
export function useInvestorSafe() {
  const context = useContext(InvestorContext);
  return context || null;
}
