import useSWR from 'swr';
import { useAuth } from '@/lib/auth';
import {
  getActivePitches,
  getInvestmentsByInvestorId,
  getAccountBalance,
  getTotalReturns,
  getPitchById,
  getProfitDistributionsByPitchId,
  getInvestorPayoutsByDistributionId,
  getTotalInvested,
  getOverallROI
} from '@/lib/data';
import {
  getCurrentUser,
  getCurrentBusinessUser,
  getTransactionHistory
} from '@/lib/action';

export function useInvestorPitches() {
  return useSWR('investor-pitches', getActivePitches);
}

export function useInvestorPortfolio(userId?: string) {
  return useSWR(
    userId ? ['investor-portfolio', userId] : null,
    async () => {
      const [investments, accountBalance, totalReturns, totalInvested, overallROI] = await Promise.all([
        getInvestmentsByInvestorId(userId!),
        getAccountBalance(userId!),
        getTotalReturns(userId!),
        getTotalInvested(userId!),
        getOverallROI(userId!)
      ]);
      return { investments, accountBalance, totalReturns, totalInvested, overallROI };
    }
  );
}

export function useInvestorInvestmentDetails(userId?: string) {
  return useSWR(
    userId ? ['investor-investment-details', userId] : null,
    async () => {
      const investments = await getInvestmentsByInvestorId(userId!);
      return Promise.all(
        investments.map(async (investment) => {
          const pitch = await getPitchById(investment.pitch_id);
          const distributions = await getProfitDistributionsByPitchId(investment.pitch_id);
          const allMyInvestments = investments.filter(
            (inv) => inv.pitch_id === investment.pitch_id && inv.investor_id === investment.investor_id
          );
          const getShares = (inv: any) =>
            inv.investment_amount && inv.tier?.multiplier
              ? inv.investment_amount * inv.tier.multiplier
              : 0;
          const totalShares = allMyInvestments.reduce((sum, inv) => sum + getShares(inv), 0);
          let totalPayout = 0;
          for (const dist of distributions) {
            const payouts = await getInvestorPayoutsByDistributionId(dist.id);
            payouts.forEach((payout) => {
              if (payout.investor_id === userId) totalPayout += payout.amount;
            });
          }
          const thisShare = getShares(investment);
          const investmentReturns = totalShares > 0 ? totalPayout * (thisShare / totalShares) : 0;
          const roi =
            investment.investment_amount > 0
              ? ((investmentReturns - investment.investment_amount) / investment.investment_amount) * 100
              : 0;
          return { investment, pitch, investmentReturns, roi };
        })
      );
    }
  );
}

export function useInvestorProfitPayouts(userId?: string) {
  return useSWR(
    userId ? ['investor-profit-payouts', userId] : null,
    async () => {
      const investments = await getInvestmentsByInvestorId(userId!);
      const allPitchIds = [...new Set(investments.map((inv) => inv.pitch_id))];
      let payoutsArr: any[] = [];
      for (const pitchId of allPitchIds) {
        const pitch = await getPitchById(pitchId);
        const distributions = await getProfitDistributionsByPitchId(pitchId);
        for (const dist of distributions) {
          const payouts = await getInvestorPayoutsByDistributionId(dist.id);
          const myPayouts = payouts.filter((p) => p.investor_id === userId);
          for (const payout of myPayouts) {
            payoutsArr.push({ payout, distribution: dist, pitch });
          }
        }
      }
      const grouped: Record<string, { distribution: any; pitch: any; totalAmount: number; userSharePercent: number }> = {};
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
      Object.values(grouped).forEach((group) => {
        const totalProfit = group.distribution.total_profit || 0;
        group.userSharePercent = totalProfit > 0 ? (group.totalAmount / totalProfit) * 100 : 0;
      });
      return Object.values(grouped).sort(
        (a, b) => new Date(b.distribution.distribution_date).getTime() - new Date(a.distribution.distribution_date).getTime()
      );
    }
  );
}

export function useInvestorProfile() {
  return useSWR('investor-profile', async () => {
    const userResult = await getCurrentUser();
    let businessUser = null;
    if (userResult.success && userResult.data) {
      if (userResult.data.account_type === 'business') {
        const businessResult = await getCurrentBusinessUser();
        if (businessResult.success && businessResult.data) {
          businessUser = businessResult.data;
        }
      }
      return { user: userResult.data, businessUser };
    }
    return null;
  });
}

export function useInvestorTransactions() {
  return useSWR('investor-transactions', getTransactionHistory);
}
