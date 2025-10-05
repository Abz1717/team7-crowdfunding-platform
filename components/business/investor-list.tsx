import { getInvestmentsByPitchId, getPitchById } from "@/lib/data";
import { getUsersByIds, UserName } from "@/lib/get-users-by-ids";
import { Investment } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User2, DollarSign, Percent } from "lucide-react";
import React, { useEffect, useState } from "react";



interface InvestorListProps {
  pitchId: string;
  pitchTitle?: string;
}

export function InvestorList({ pitchId, pitchTitle }: InvestorListProps) {
  const [investors, setInvestors] = useState<{
    investor_id: string;
    name: string;
    totalInvested: number;
    totalShares: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvestors() {
      setLoading(true);
      const [investments, pitch] = await Promise.all([
        getInvestmentsByPitchId(pitchId),
        getPitchById(pitchId),
      ]);
      // Group by investor_id
  const grouped: Record<string, { investor_id: string; totalInvested: number; totalShares: number }> = {};
      let totalPitchInvested = 0;
      for (const inv of investments) {
        totalPitchInvested += inv.investment_amount;
        if (!grouped[inv.investor_id]) {
          grouped[inv.investor_id] = {
            investor_id: inv.investor_id,
            totalInvested: 0,
            totalShares: 0,
          };
        }
        grouped[inv.investor_id].totalInvested += inv.investment_amount;
        grouped[inv.investor_id].totalShares += (inv.investment_amount && inv.tier?.multiplier) ? inv.investment_amount * inv.tier.multiplier : 0;
      }
      const investorIds = Object.keys(grouped);
      const users: UserName[] = await getUsersByIds(investorIds);
      const investorsWithNames = investorIds.map(id => {
        const user = users.find(u => u.id === id);
        return {
          investor_id: id,
          name: user ? `${user.first_name} ${user.last_name}` : id,
          totalInvested: grouped[id].totalInvested,
          totalShares: grouped[id].totalShares,
        };
      });
      setInvestors(investorsWithNames);
      setLoading(false);
    }
    fetchInvestors();
  }, [pitchId]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{pitchTitle ? `Investors for: ${pitchTitle}` : "Investors"}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div>Loading investors...</div>
        ) : investors.length === 0 ? (
          <div>No investors found for this pitch.</div>
        ) : (
          <div className="space-y-3">
            {investors.map((inv) => (
              <div key={inv.investor_id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{inv.name}</div>
                  <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Invested: ${inv.totalInvested.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Percent className="h-4 w-4" /> Shares: {inv.totalShares.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
