"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowDownLeft, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  useMyPitches,
  useBusinessAccountBalance,
  useProfitDistributions
} from "@/hooks/useBusinessData";
import LoadingScreen from "@/components/loading-screen";
import { InvestorList } from "@/components/business/investor-list";

export default function BusinessDashboardPage() {

  const { user } = useAuth();
  const { data: myPitchesData, isLoading: loadingPitches } = useMyPitches();
  const { data: accountBalance, isLoading: loadingBalance } = useBusinessAccountBalance();
  const { data: profitDistributions, isLoading: loadingDistributions } = useProfitDistributions();
  
  const fundingBalance = user?.funding_balance ?? 0;

  // Debug logging for account balance
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[Dashboard] accountBalance:", accountBalance, "loadingBalance:", loadingBalance);
  }
  const myPitches = useMemo(() => myPitchesData?.pitches || [], [myPitchesData]);
  const [fundingActivity, setFundingActivity] = useState<any[]>([]);
  const loading = loadingPitches || loadingBalance || loadingDistributions;

  useEffect(() => {
    if (!myPitches) return;
    const releasedPitches = myPitches.filter(
      (p: any) => p.funds_released || p.released_at
    );
    const activity = releasedPitches.map((pitch: any) => ({
      id: pitch.id,
      title: pitch.title,
      fundedAt:
        pitch.released_at ||
        pitch.funded_at ||
        pitch.updated_at ||
        pitch.created_at,
      amount: pitch.target_amount,
      elevatorPitch: pitch.elevator_pitch,
    }));
    activity.sort(
      (a, b) => new Date(b.fundedAt).getTime() - new Date(a.fundedAt).getTime()
    );
    setFundingActivity(activity);
  }, [myPitches]);

  // Transform cached profit distributions into the format needed for display
  const transformedProfitDistributions = (profitDistributions || [])
    .flatMap((pitchDist) => {
      const pitch = myPitches.find((p) => p.id === pitchDist.pitchId);
      if (!pitch) return [];
      return pitchDist.distributions.map((dist) => ({
        pitchTitle: pitch.title,
        pitchId: pitch.id,
        elevatorPitch: pitch.elevator_pitch,
        targetAmount: pitch.target_amount,
        pitchImage:
          Array.isArray(pitch.supporting_media) &&
          pitch.supporting_media.length > 0
            ? pitch.supporting_media[0]
            : typeof pitch.supporting_media === "string"
            ? pitch.supporting_media
            : null,
        distributionId: dist.id,
        distributionDate: dist.distribution_date,
        totalProfit: dist.total_profit,
        businessProfit: dist.business_profit,
        totalPaidToInvestors: dist.total_profit - dist.business_profit,
        businessRetained: dist.business_profit,
      }));
    })
    .sort(
      (a, b) =>
        new Date(b.distributionDate).getTime() -
        new Date(a.distributionDate).getTime()
    );

  const allPitches = myPitches;
  const [investorPage, setInvestorPage] = useState(0);
  const totalInvestorPages = allPitches.length;
  const currentPitch = allPitches[investorPage];

  const [profitPage, setProfitPage] = useState(1);
  const profitsPerPage = 3;
  const totalProfitPages = Math.ceil(
    transformedProfitDistributions.length / profitsPerPage
  );
  const pagedProfits = transformedProfitDistributions.slice(
    (profitPage - 1) * profitsPerPage,
    profitPage * profitsPerPage
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Business Dashboard</h1>
      <p className="mb-8">Welcome to your Business dashboard.</p>

      <div className="flex flex-row gap-6 mb-8 w-full">
        <div className="flex flex-1 gap-6 min-w-0">
          <Card className="flex-1 min-w-[200px] max-w-xs">
            <CardHeader>
              <CardTitle>Funding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-blue-400">
                ${fundingBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Funds raised from investors for your business.</p>
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[200px] max-w-xs">
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBalance ? (
                <LoadingScreen />
              ) : typeof accountBalance === "number" ? (
                <span className="text-2xl font-bold text-green-600">
                  ${accountBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="text-red-500">--</span>
              )}
              <p className="text-xs text-muted-foreground mt-1">Used for ads, fees, and profit distributions.</p>
            </CardContent>
          </Card>
        </div>
        <Card className="flex-1 min-w-[260px] max-w-xs self-stretch">
          <CardHeader>
            <CardTitle>Advertise Your Pitch</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full justify-between">
            <div>
              <p className="mb-4 text-muted-foreground text-sm">
                Boost your pitch's visibility and attract more investors by promoting it on our platform.
              </p>
            </div>
            <Link href="/business/my-pitches" className="mt-auto">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md transition-colors duration-200" type="button">
                Advertise Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Funding Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fundingActivity.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No funding activity yet
              </div>
            ) : (
              fundingActivity.slice(0, 3).map((fund) => (
                <div
                  key={fund.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      Received ${fund.amount.toLocaleString()} for {fund.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fund.elevatorPitch}
                      <br />
                      {fund.fundedAt
                        ? new Date(fund.fundedAt).toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                  <Link href={`/business/pitch/${fund.id}`}>
                    <Button size="sm" variant="outline">
                      View Pitch
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Declaring Profit Record Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Declaring Profit Record</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingScreen />
          ) : transformedProfitDistributions.length === 0 ? (
            <div>No profit distributions found.</div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedProfits.map((dist, idx) => (
                  <div
                    key={dist.distributionId}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        ${dist.totalProfit.toLocaleString()} from{" "}
                        {dist.pitchTitle}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Declared on{" "}
                        {new Date(dist.distributionDate).toLocaleDateString()} •
                        Target: ${dist.targetAmount?.toLocaleString?.()}
                        <br />
                        Investors Paid: $
                        {dist.totalPaidToInvestors.toLocaleString()} • Business
                        Retained: ${dist.businessRetained.toLocaleString()}
                      </div>
                    </div>
                    {dist.pitchId && (
                      <Link href={`/business/pitch/${dist.pitchId}`}>
                        <Button size="sm" variant="outline">
                          View Pitch
                        </Button>
                      </Link>
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
                    onClick={() =>
                      setProfitPage((p) => Math.min(totalProfitPages, p + 1))
                    }
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

      {!loading && totalInvestorPages > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Investors </CardTitle>
          </CardHeader>
          <CardContent>
            <InvestorList
              pitchId={currentPitch?.id}
              pitchTitle={currentPitch?.title}
            />
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
                  onClick={() =>
                    setInvestorPage((p) =>
                      Math.min(totalInvestorPages - 1, p + 1)
                    )
                  }
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
  );
}
