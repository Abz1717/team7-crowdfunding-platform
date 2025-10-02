"use client"

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { getPitchesByBusinessId, getProfitDistributionsByPitchId, getInvestorPayoutsByDistributionId } from "@/lib/data";
import { useBusinessUser } from "@/hooks/useBusinessUser";

export default function BusinessPage() {
  const { user } = useAuth();
  const { businessUser, loading: businessUserLoading } = useBusinessUser(user || undefined);
  const [profitDistributions, setProfitDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDistributions() {
      if (!user || businessUserLoading) {
        console.log('[DEBUG] No user or businessUser still loading');
        return;
      }
      if (!businessUser) {
        console.log('[DEBUG] No businessUser found');
        setProfitDistributions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const pitches = await getPitchesByBusinessId(businessUser.id);
      console.log("[DEBUG] Business user id:", businessUser.id);
      console.log("[DEBUG] Business pitches:", pitches);
      let allDistributions: any[] = [];
      for (const pitch of pitches) {
        console.log(`[DEBUG] Fetching distributions for pitch:`, pitch.id, pitch.title);
        const distributions = await getProfitDistributionsByPitchId(pitch.id);
        console.log(`[DEBUG] Distributions for pitch ${pitch.id} (${pitch.title}):`, distributions);
        for (const dist of distributions) {
          console.log(`[DEBUG] Distribution object:`, dist);
          const payouts = await getInvestorPayoutsByDistributionId(dist.id);
          console.log(`[DEBUG] Payouts for distribution ${dist.id}:`, payouts);
          const totalPaidToInvestors = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
          allDistributions.push({
            pitchTitle: pitch.title,
            pitchId: pitch.id,
            distributionId: dist.id,
            distributionDate: dist.distribution_date,
            totalProfit: dist.total_profit,
            businessProfit: dist.business_profit,
            totalPaidToInvestors,
            businessRetained: typeof dist.business_profit === 'number' ? dist.business_profit : (dist.total_profit - totalPaidToInvestors),
          });
        }
      }
      // Sort by most recent first
      allDistributions.sort((a, b) => new Date(b.distributionDate).getTime() - new Date(a.distributionDate).getTime());
      console.log('[DEBUG] All distributions to display:', allDistributions);
      setProfitDistributions(allDistributions);
      setLoading(false);
    }
    fetchDistributions();
  }, [user, businessUser, businessUserLoading]);

  return (  
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Business Dashboard</h1>
      <p className="mb-8">Welcome to your Business dashboard.</p>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Declaring Profit</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading profit distributions...</div>
          ) : profitDistributions.length === 0 ? (
            <div>No profit distributions found.</div>
          ) : (
            <div className="space-y-4">
              {profitDistributions.map((dist, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="mb-2 md:mb-0">
                    <div className="font-semibold">{dist.pitchTitle}</div>
                    <div className="text-sm text-muted-foreground">{new Date(dist.distributionDate).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <Badge variant="default">Total Profit: ${dist.totalProfit.toLocaleString()}</Badge>
                    <Badge variant="secondary">Paid to Investors: ${dist.totalPaidToInvestors.toLocaleString()}</Badge>
                    <Badge variant="outline">Business Retained: ${dist.businessRetained.toLocaleString()}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}