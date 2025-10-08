
import useSWR from 'swr';
import { getCurrentBusinessUser, getCurrentUser, getTransactionHistory } from '@/lib/action';
import { getPitchesByBusinessId, getActivePitches, getInvestmentsByPitchId, getProfitDistributionsByPitchId, getAccountBalance } from '@/lib/data';
import { useAuth } from '@/lib/auth';

// helpers
const fetchBusinessUser = async () => {
  const res = await getCurrentBusinessUser();
  if (!res.success || !res.data) throw new Error('No business user');
  return res.data;
};

export function useBusinessUser() {
  return useSWR('business-user', fetchBusinessUser);
}

export function useMyPitches() {
  const { data: businessUser } = useBusinessUser();
  return useSWR(
    businessUser ? ['my-pitches', businessUser.id] : null,
    async ([, businessUserId]) => {
      const pitches = await getPitchesByBusinessId(businessUserId);
      const mapPitch = (p: any) => ({
        id: p.id,
        title: p.title,
        elevator_pitch: p.elevator_pitch,
        detailed_pitch: p.detailed_pitch,
        target_amount: p.target_amount,
        current_amount: p.current_amount,
        profit_share: p.profit_share,
        profit_distribution_frequency: p.profit_distribution_frequency ?? "",
        tags: p.tags ?? [],
        end_date: p.end_date,
        status: p.status as "draft" | "active" | "funded" | "closed",
        ai_rating: p.ai_rating ?? null,
        ai_feedback: p.ai_feedback ?? null,
        ai_analysis: p.ai_analysis ?? null,
        created_at: p.created_at,
        updated_at: p.updated_at,
        business_id: p.business_id ?? null,
        supporting_media: Array.isArray(p.supporting_media) ? p.supporting_media : [],
        investment_tiers: Array.isArray(p.investment_tiers) ? p.investment_tiers.map((tier: any) => ({
          name: tier.name,
          minAmount: tier.minAmount ?? "",
          maxAmount: tier.maxAmount ?? "",
          multiplier: tier.multiplier ?? "1.0"
        })) : [],
        next_profit_distribution_at: p.next_profit_distribution_at ?? null,
        fully_funded_at: p.fully_funded_at ?? null,
        released_at: p.released_at ?? null,
      });
      const mappedPitches = pitches.map(mapPitch);
      const pitchesWithInvestors = await Promise.all(
        mappedPitches.map(async (pitch) => {
          const investors = await getInvestmentsByPitchId(pitch.id);
          const totalInvested = investors.reduce((sum, inv) => sum + inv.investment_amount, 0);
          return { pitch, investors, totalInvested };
        })
      );
      return { pitches: mappedPitches, pitchesWithInvestors };
    }
  );
}

export function useOtherPitches() {
  const { data: businessUser } = useBusinessUser();
  return useSWR(
    businessUser ? ['other-pitches', businessUser.id] : null,
    async () => {
      return await getActivePitches();
    }
  );
}

export function useBusinessProfile() {
  return useSWR('business-profile', getCurrentUser);
}

export function useProfitDistributions() {
  const { data: businessUser } = useBusinessUser();
  return useSWR(
    businessUser ? ['profit-distributions', businessUser.id] : null,
    async ([, businessUserId]) => {
      const pitches = await getPitchesByBusinessId(businessUserId);
      return Promise.all(
        pitches.map(async (pitch) => ({
          pitchId: pitch.id,
          distributions: await getProfitDistributionsByPitchId(pitch.id),
        }))
      );
    }
  );
}

export function useBusinessTransactions() {
  return useSWR('business-transactions', getTransactionHistory);
}

export function useBusinessAccountBalance() {
  const { data: businessUser } = useBusinessUser();
  return useSWR(
    businessUser && businessUser.user_id ? ['business-account-balance', businessUser.user_id] : null,
    async ([, userId]) => getAccountBalance(userId)
  );
}

export function useBusinessFundingBalance() {
  const { data: businessUser } = useBusinessUser();
  return useSWR(
    businessUser && businessUser.user_id ? ['business-funding-balance', businessUser.user_id] : null,
    async ([, userId]) => {
      const res = await fetch('/api/user');
      if (!res.ok) throw new Error('Failed to fetch user');
      const user = await res.json();
      return user.funding_balance;
    }
  );
}