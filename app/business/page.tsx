"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { getPitchesByBusinessId, getProfitDistributionsByPitchId, getInvestorPayoutsByDistributionId } from "@/lib/data";
import { useBusinessUser } from "@/hooks/useBusinessUser";
import { InvestorList } from '@/components/business/investor-list';

export default function BusinessDashboardPage() {
  const { user } = useAuth();
  const { businessUser, loading: businessUserLoading } = useBusinessUser(user || undefined);
  const [profitDistributions, setProfitDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Investor paging state and logic
  const uniquePitches = Array.from(new Set(profitDistributions.map(d => d.pitchId)))
    .map(pitchId => ({
      id: pitchId,
      title: profitDistributions.find(d => d.pitchId === pitchId)?.pitchTitle || "",
    }));
  const [investorPage, setInvestorPage] = useState(0);
  const totalInvestorPages = uniquePitches.length;
  const currentPitch = uniquePitches[investorPage];

  useEffect(() => {
    async function fetchDistributions() {
      if (!user || businessUserLoading) {
        return;
      }
      if (!businessUser) {
        setProfitDistributions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const pitches = await getPitchesByBusinessId(businessUser.id);

      let allDistributions: any[] = [];
      for (const pitch of pitches) {
        const distributions = await getProfitDistributionsByPitchId(pitch.id);
        for (const dist of distributions) {
          const payouts = await getInvestorPayoutsByDistributionId(dist.id);
          const totalPaidToInvestors = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
          allDistributions.push({
            pitchTitle: pitch.title,
            pitchId: pitch.id,
            elevatorPitch: pitch.elevator_pitch,
            targetAmount: pitch.target_amount,
            pitchImage: Array.isArray(pitch.supporting_media) && pitch.supporting_media.length > 0 ? pitch.supporting_media[0] : (typeof pitch.supporting_media === 'string' ? pitch.supporting_media : null),
            distributionId: dist.id,
            distributionDate: dist.distribution_date,
            totalProfit: dist.total_profit,
            businessProfit: dist.business_profit,
            totalPaidToInvestors,
            businessRetained: typeof dist.business_profit === 'number' ? dist.business_profit : (dist.total_profit - totalPaidToInvestors),
          });
        }
      }

      allDistributions.sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime());
      setProfitDistributions(allDistributions);
      setLoading(false);
    }
    fetchDistributions();
  }, [user, businessUser, businessUserLoading]);

  const [profitPage, setProfitPage] = useState(1);
  const profitsPerPage = 3;
  const totalProfitPages = Math.ceil(profitDistributions.length / profitsPerPage);
  const pagedProfits = profitDistributions.slice((profitPage - 1) * profitsPerPage, profitPage * profitsPerPage);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Business Dashboard</h1>
      <p className="mb-8">Welcome to your Business dashboard.</p>

      <Card className="mb-8 max-w-xs">
        <CardHeader>
          <CardTitle>Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold text-green-600">
            ${user?.account_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
          </span>
        </CardContent>
      </Card>

      {/* Declaring Profit Record Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Declaring Profit Record</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading profit distributions...</div>
          ) : profitDistributions.length === 0 ? (
            <div>No profit distributions found.</div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedProfits.map((dist, idx) => (
                  <div key={dist.distributionId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">${dist.totalProfit.toLocaleString()} from {dist.pitchTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        Declared on {new Date(dist.distributionDate).toLocaleDateString()} • Target: ${dist.targetAmount?.toLocaleString?.()}<br/>
                        Investors Paid: ${dist.totalPaidToInvestors.toLocaleString()} • Business Retained: ${dist.businessRetained.toLocaleString()}
                      </div>
                    </div>
                    {dist.pitchId && (
                      <Link href={`/business/pitch/${dist.pitchId}`}><Button size="sm" variant="outline">View Pitch</Button></Link>
                    )}
                  </div>
                ))}
              </div>
              {totalProfitPages > 1 && (
                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfitPage((p) => Math.max(1, p - 1))}
                    disabled={profitPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Page {profitPage} of {totalProfitPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfitPage((p) => Math.min(totalProfitPages, p + 1))}
                    disabled={profitPage === totalProfitPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {(!loading && businessUser && profitDistributions.length > 0 && totalInvestorPages > 0) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Investors </CardTitle>
          </CardHeader>
          <CardContent>
            <InvestorList pitchId={currentPitch?.id} pitchTitle={currentPitch?.title} />
            {totalInvestorPages > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInvestorPage((p) => Math.max(0, p - 1))}
                  disabled={investorPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  Page {investorPage + 1} of {totalInvestorPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInvestorPage((p) => Math.min(totalInvestorPages - 1, p + 1))}
                  disabled={investorPage === totalInvestorPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}