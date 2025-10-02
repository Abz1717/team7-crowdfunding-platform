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
  const [investors, setInvestors] = useState<(Investment & { name?: string; profitShare?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvestors() {
      setLoading(true);
      const [investments, pitch] = await Promise.all([
        getInvestmentsByPitchId(pitchId),
        getPitchById(pitchId),
      ]);


    const investorIds = investments.map(inv => inv.investor_id);
      const users: UserName[] = await getUsersByIds(investorIds);
      const totalInvested = investments.reduce((sum, inv) => sum + inv.investment_amount, 0);
      const investorsWithNames = investments.map(inv => {
        const user = users.find(u => u.id === inv.investor_id);
        const profitShare = totalInvested > 0 ? (inv.investment_amount / totalInvested) * 100 : 0;
        return {
          ...inv,
          name: user ? `${user.first_name} ${user.last_name}` : inv.investor_id,
          profitShare,
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
              <div key={inv.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User2 className="h-4 w-4 text-blue-600" />
                </div>

                <div className="flex-1">
                  <div className="font-medium">{inv.name}</div>
                  <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Invested: ${inv.investment_amount.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Percent className="h-4 w-4" /> Profit Share: {inv.profitShare?.toFixed(2)}%</span>
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
