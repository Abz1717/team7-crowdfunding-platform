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

  const { data: pitch, error: pitchError } = await supabase
    .from("pitch")
    .select("id, current_amount, target_amount, investment_pool, business_id, released_at")
    .eq("id", investment.pitch_id)
    .single();
  if (!pitch || pitchError) return null;

  const newCurrentAmount = (pitch.current_amount ?? 0) + investment.investment_amount;
  if (newCurrentAmount > (pitch.target_amount ?? 0)) {
    return null;
  }

  // If no tier, treat multiplier as 1
  const effectiveValue = investment.investment_amount * (investment.tier?.multiplier ?? 1);
  const newPool = (pitch.investment_pool ?? 0) + investment.amount;
  const isFullyFunded = newCurrentAmount >= (pitch.target_amount ?? 0);

  // Remove tier if null to avoid DB issues
  const investmentToInsert = { ...investment };
  if (typeof investmentToInsert.tier === "undefined" || investmentToInsert.tier === null) {
    delete (investmentToInsert as any).tier;
  }

  const { data, error } = await supabase
    .from("investment")
    .insert([investmentToInsert])
    .select()
    .single();
  if (!data || error) return null;

  if (isFullyFunded && !pitch.released_at) {
    const businessId = pitch.business_id;
    const { data: businessUser, error: businessUserError } = await supabase
      .from("businessuser")
      .select("user_id")
      .eq("id", businessId)
      .single();
    if (!businessUser || businessUserError) return null;

    // fetchin funding_balance instead of account_balance
    const { data: userRow, error: userError } = await supabase
      .from("user")
      .select("funding_balance")
      .eq("id", businessUser.user_id)
      .single();
    if (!userRow || userError) return null;

    const updatedFundingBalance = (userRow.funding_balance ?? 0) + newPool;

    const { error: updateUserError } = await supabase
      .from("user")
      .update({ funding_balance: updatedFundingBalance })
      .eq("id", businessUser.user_id);
    if (updateUserError) return null;

    const { error: updatePitchError } = await supabase
      .from("pitch")
      .update({
        current_amount: newCurrentAmount,
        status: "funded",
        investment_pool: 0,
        released_at: new Date().toISOString(),
      })
      .eq("id", investment.pitch_id);
    if (updatePitchError) return null;
  } else {

    const { error: updatePitchError } = await supabase
      .from("pitch")
      .update({
        investment_pool: newPool,
        current_amount: newCurrentAmount,
      })
      .eq("id", investment.pitch_id);
    if (updatePitchError) return null;
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
    .select("investment_amount, refunded")
    .eq("investor_id", userId);

  if (error || !data) return 0;
  // Only sum investments that are not refunded
  return data.reduce((sum: number, inv: { investment_amount: number, refunded?: boolean }) =>
    !inv.refunded ? sum + inv.investment_amount : sum, 0);
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
  // ROI = ((returns - invested) / invested) * 100
  return invested > 0 ? ((returns - invested) / invested) * 100 : 0;
}


export async function refundInvestorsIfPitchClosed(pitchId: string): Promise<void> {
  const supabase = createClient();

  const { data: pitch } = await supabase
    .from("pitch")
    .select("id, current_amount, target_amount, status")
    .eq("id", pitchId)
    .single();
  if (!pitch) return;

  if (pitch.current_amount >= pitch.target_amount) return;

  const { data: investments } = await supabase
    .from("investment")
    .select("id, investor_id, investment_amount, refunded, refunded_amount")
    .eq("pitch_id", pitchId);
  if (!investments) return;

  for (const inv of investments) {
    if (inv.refunded) continue;

    const { data: userRow } = await supabase
      .from("user")
      .select("account_balance")
      .eq("id", inv.investor_id)
      .single();
    if (!userRow) continue;
    const updatedBalance = (userRow.account_balance ?? 0) + (inv.investment_amount ?? 0);
    await supabase
      .from("user")
      .update({ account_balance: updatedBalance })
      .eq("id", inv.investor_id);

    await supabase
      .from("investment")
      .update({ refunded: true, refunded_amount: inv.investment_amount })
      .eq("id", inv.id);
  }
}


export async function createAdCampaign(adCampaign: Omit<import("./types").AdCampaign, "id" | "created_at" | "updated_at" | "status"> & { status?: string }): Promise<import("./types").AdCampaign | null> {
  const supabase = createClient();
  console.log("Attempting to insert ad_campaign:", adCampaign);
  const { data, error } = await supabase
    .from("ad_campaign")
    .insert([{ ...adCampaign }])
    .select()
    .single();
  if (error) {
    console.error("Supabase ad_campaign insert error:", error);
    return null;
  }
  return data ?? null;
}



export async function getBusinessUserByPitchId(pitchId: string): Promise<{ id: string; user_id: string } | null> {
  const supabase = createClient();
  const { data: pitch } = await supabase.from("pitch").select("business_id").eq("id", pitchId).single();
  if (!pitch) return null;
  const { data: businessUser } = await supabase.from("businessuser").select("id, user_id").eq("id", pitch.business_id).single();
  return businessUser;
}

//active ad campaign by pitch id
export async function getActiveAdCampaignByPitchId(pitchId: string): Promise<{ id: string } | null> {
  const supabase = createClient();
  const { data: campaign } = await supabase.from("ad_campaign").select("id").eq("pitch_id", pitchId).eq("status", "active").single();
  return campaign;
}
// + clicks for an ad campaign - cost from campaign budget and business account balance
export async function updateAdCampaignClicksAndBalance({
  adCampaignId,
  businessUserId,
  userId,
  clickCount = 1,
}: {
  adCampaignId: string;
  businessUserId: string;
  userId: string;
  clickCount?: number;

}): Promise<{ success: boolean; newClicks?: number; newBudget?: number; newAccountBalance?: number; error?: string }> {
  const supabase = createClient();
  const clickCost = 0.01;

  // current campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("ad_campaign")
    .select("id, clicks, budget, status")
    .eq("id", adCampaignId)
    .single();
  if (!campaign || campaignError) return { success: false, error: "Ad campaign not found" };
  if (campaign.status !== "active") return { success: false, error: "Ad campaign is not active" };

  const { data: businessUser, error: businessUserError } = await supabase
    .from("businessuser")
    .select("user_id")
    .eq("id", businessUserId)
    .single();
  if (!businessUser || businessUserError) return { success: false, error: "Business user not found" };

  // fetch user to get account_balance
  const { data: user, error: userError } = await supabase
    .from("user")
    .select("account_balance")
    .eq("id", userId)
    .single();
  if (!user || userError) return { success: false, error: "User not found" };

  const newClicks = (campaign.clicks ?? 0) + clickCount;
  const totalClickCost = clickCount * clickCost;

  const newBudget = Math.max(0, (campaign.budget ?? 0) - totalClickCost);
  const newAccountBalance = Math.max(0, (user.account_balance ?? 0) - totalClickCost);

  if ((campaign.budget ?? 0) < totalClickCost) {
    await supabase.from("ad_campaign").update({ status: "inactive" }).eq("id", adCampaignId);
    return { success: false, error: "Ad campaign budget depleted. Campaign turned off." };
  }

  // update ad campaign clicks and budget
  const { error: updateCampaignError } = await supabase
    .from("ad_campaign")
    .update({ clicks: newClicks, budget: newBudget })
    .eq("id", adCampaignId);
  if (updateCampaignError) return { success: false, error: "Failed to update ad campaign" };

    // account_balance
  const { error: updateUserError } = await supabase
    .from("user")
    .update({ account_balance: newAccountBalance })
    .eq("id", userId);
  if (updateUserError) return { success: false, error: "Failed to update user account balance" };

  return { success: true, newClicks, newBudget, newAccountBalance };
}



export async function extendAdCampaignBudget(adCampaignId: string, amount: number): Promise<{ success: boolean; newBudget?: number; error?: string }> {
  const supabase = createClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("ad_campaign")
    .select("budget")
    .eq("id", adCampaignId)
    .single();

  if (!campaign || campaignError) return { success: false, error: "Ad campaign not found" };
  const newBudget = (campaign.budget ?? 0) + amount;

  const { error: updateError } = await supabase
    .from("ad_campaign")
    .update({ budget: newBudget })
    .eq("id", adCampaignId);
  if (updateError) return { success: false, error: "Failed to update budget" };
  return { success: true, newBudget };
}

export async function turnOffAdCampaign(adCampaignId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ad_campaign")
    .update({ status: "inactive" })
    .eq("id", adCampaignId);
  if (error) return { success: false, error: "Failed to turn off ad campaign" };
  return { success: true };
}




export async function pauseAdCampaign(adCampaignId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ad_campaign")
    .update({ status: "paused" })
    .eq("id", adCampaignId);
  if (error) return { success: false, error: "Failed to pause ad campaign" };
  return { success: true };
}

export async function resumeAdCampaign(adCampaignId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ad_campaign")
    .update({ status: "active" })
    .eq("id", adCampaignId);
  if (error) return { success: false, error: "Failed to resume ad campaign" };
  return { success: true };
}

export async function endAdCampaign(adCampaignId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ad_campaign")
    .update({ status: "ended" })
    .eq("id", adCampaignId);
  if (error) return { success: false, error: "Failed to end ad campaign" };
  return { success: true };
}
