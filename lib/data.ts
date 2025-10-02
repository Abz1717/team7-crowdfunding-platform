
import { createClient } from "@/utils/supabase/client";

import type { Pitch, Investment, InvestmentTier, ProfitDistribution, InvestorPayout } from "./types"


export async function getPitchesByBusinessId(businessId: string): Promise<Pitch[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pitch")
    .select("*")
    .eq("business_id", businessId);
  return data ?? [];
}

export async function getPitchById(id: string): Promise<Pitch | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pitch")
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}

export async function getActivePitches(): Promise<Pitch[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pitch")
    .select("*")
    .eq("status", "active");
  return data ?? [];
}

export async function getInvestmentsByInvestorId(investorId: string): Promise<Investment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment")
    .select("*")
    .eq("investor_id", investorId);
  return data ?? [];
}

export async function getInvestmentsByPitchId(pitchId: string): Promise<Investment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment")
    .select("*")
    .eq("pitch_id", pitchId);
  return data ?? [];
}

export async function getProfitDistributionsByPitchId(pitchId: string): Promise<ProfitDistribution[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profit_distribution")
    .select("id, pitch_id, total_profit, business_profit, distribution_date")
    .eq("pitch_id", pitchId);
  return (data ?? []).map((dist) => ({
    ...dist,
    business_profit: dist.business_profit !== null && dist.business_profit !== undefined ? Number(dist.business_profit) : 0,
    total_profit: dist.total_profit !== null && dist.total_profit !== undefined ? Number(dist.total_profit) : 0,
  }));
}

export async function updatePitch(id: string, updates: Partial<Pitch>): Promise<boolean> {
  const supabase = createClient();
  const {error} = await supabase
    .from("pitch")
    .update(updates)
    .eq("id", id);
  return !error;
}

export async function createPitch(pitch: Omit<Pitch, "id" | "createdAt" | "updatedAt">): Promise<Pitch | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pitch")
    .insert([pitch])
    .single();
  return data ?? null;
}

export async function createInvestment(investment: Omit<Investment, "id" | "investedAt" | "returns">): Promise <Investment | null> {
  const supabase = createClient();

  const { data: pitchData, error: pitchError } = await supabase
    .from("pitch")
    .select("current_amount, target_amount")
    .eq("id", investment.pitch_id)
    .single();

  if (!pitchData || pitchError) return null;

  const { current_amount = 0, target_amount = 0 } = pitchData;
  if (current_amount + investment.investment_amount > target_amount) {
    return null;
  }

  const { data, error } = await supabase
    .from("investment")
    .insert([investment])
    .select()
    .single();

  if (!data || error) return null;


  const newAmount = current_amount + investment.investment_amount;
  let statusUpdate = {};
  if (newAmount >= target_amount) {
    statusUpdate = { status: "funded" };
  }

  const { error: updateError } = await supabase
    .from("pitch")
    .update({ current_amount: newAmount, ...statusUpdate })
    .eq("id", investment.pitch_id);
  if (updateError) {
    console.error('Failed to update pitch status:', updateError.message, updateError.details);
  }

  return data;
}

export async function calculateROI(userId: string): Promise<number> {
  const invested = await getTotalInvested(userId);
  const returns = await getTotalReturns(userId);

  return invested > 0 ? (returns / invested) * 100 : 0;

}

export async function getAccountBalance(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user")
    .select("account_balance")
    .eq("id", userId)
    .single();
  return data?.account_balance ?? 0;
}

export async function updateAccountBalance(userId: string, newBalance: number): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user")
    .update({ account_balance: newBalance })
    .eq("id", userId);
  return !error;
}



export async function getTotalInvested(userId: string): Promise<number> {
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment")
    .select("investment_amount")
    .eq("investor_id", userId);

  if (error || !data) return 0;
  return data.reduce((sum: number, inv: { investment_amount: number }) => sum + inv.investment_amount, 0);
}

export async function getTotalReturns(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("investor_payout")
    .select("amount")
    .eq("investor_id", userId);

  if (error || !data) return 0;
  return data.reduce((sum: number, payout: { amount: number }) => sum + payout.amount, 0);
}

export async function getInvestorPayoutsByDistributionId(distributionId: string): Promise<InvestorPayout[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("investor_payout")
    .select("*")
    .eq("distribution_id", distributionId);
  return data ?? [];
}

export async function getOverallROI(userId: string): Promise<number> {

  const invested = await getTotalInvested(userId);
  const returns = await getTotalReturns(userId);
  return invested > 0 ? (returns / invested) * 100 : 0;
}