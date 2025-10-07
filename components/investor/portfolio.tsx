"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "@/components/loading-screen";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Helper to render colored tier badges with accurate metallic colors
function TierBadge({
  tier,
  className = "",
}: {
  tier: string;
  className?: string;
}) {
  let color = "bg-gray-400 text-white";
  // Bronze: #b08d57 (metallic bronze)
  // Silver: #bfc1c2 (metallic silver)
  // Gold: #ffd700 (metallic gold)
  if (tier.toLowerCase() === "bronze")
    color = "bg-[#b08d57] text-white border-[#a97142] shadow-[0_0_8px_#b08d57]";
  else if (tier.toLowerCase() === "silver")
    color = "bg-[#bfc1c2] text-black border-[#a7a9ac] shadow-[0_0_8px_#bfc1c2]";
  else if (tier.toLowerCase() === "gold")
    color = "bg-[#ffd700] text-black border-[#e6be8a] shadow-[0_0_8px_#ffd700]";
  return (
    <Badge className={className + " " + color + " border-2 font-semibold"}>
      {tier} Tier
    </Badge>
  );
}
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { Investment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Target,
} from "lucide-react";
import {
  useInvestorPortfolio,
  useInvestorInvestmentDetails,
  useInvestorProfitPayouts
} from "@/hooks/useInvestorData";

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


export function Portfolio() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: portfolioData, isLoading: isPortfolioLoading } = useInvestorPortfolio(userId) || {};
  const { data: investmentDetails = [], isLoading: isInvestmentsLoading } = useInvestorInvestmentDetails(userId) || {};
  const { data: profitPayouts = [], isLoading: isProfitPayoutsLoading } = useInvestorProfitPayouts(userId) || {};
  const [groupBy, setGroupBy] = useState<"combined" | "all">("all");
  const [status, setStatus] = useState<"active" | "funded" | "closed">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [profitPayoutsPage, setProfitPayoutsPage] = useState(1);
  const investmentsPerPage = 3;
  const profitPayoutsPerPage = 3;
  const accountBalance = portfolioData?.accountBalance || 0;
  const totalInvested = portfolioData?.totalInvested || 0;
  const totalReturns = portfolioData?.totalReturns || 0;
  const overallROI = portfolioData?.overallROI || 0;
  const investments = portfolioData?.investments || [];
  const isWithdrawing = false;

  // --- FILTER/GROUP LOGIC FOR INVESTMENT LIST ---
  // Helper: status filter
  const statusMatches = (pitchStatus: string) => {
    if (status === "active") return pitchStatus === "active";
    if (status === "funded") return pitchStatus === "funded";
    if (status === "closed")
      return pitchStatus === "closed" || pitchStatus === "refunded";
    return true;
  };

  let filteredInvestments = investmentDetails.filter(
    ({ pitch }) => pitch && statusMatches(pitch.status)
  );

  type DisplayInvestment = (typeof investmentDetails)[number] & {
    totalShares?: number;
  };
  let displayInvestments: DisplayInvestment[] = [];
  if (groupBy === "combined") {
    const grouped: Record<
      string,
      {
        investment: Investment;
        pitch: any;
        investmentReturns: number;
        roi: number;
        totalAmount: number;
        totalShares: number;
      }
    > = {};
    for (const {
      investment,
      pitch,
      investmentReturns,
    } of filteredInvestments) {
      if (!pitch) continue;
      if (!grouped[pitch.id]) {
        grouped[pitch.id] = {
          investment: { ...investment },
          pitch,
          investmentReturns: 0,
          roi: 0,
          totalAmount: 0,
          totalShares: 0,
        };
      }
      grouped[pitch.id].totalAmount += investment.investment_amount;
      grouped[pitch.id].totalShares +=
        investment.investment_amount * (typeof investment.tier?.multiplier === "number" ? investment.tier.multiplier : 1);
      grouped[pitch.id].investmentReturns += investmentReturns;
    }
    displayInvestments = Object.values(grouped).map((g) => ({
      investment: {
        ...g.investment,
        investment_amount: g.totalAmount,
      },
      pitch: g.pitch,
      investmentReturns: g.investmentReturns,
      roi:
        g.totalAmount > 0
          ? ((g.investmentReturns - g.totalAmount) / g.totalAmount) * 100
          : 0,
      totalShares: g.totalShares,
    }));
  } else {
    displayInvestments = filteredInvestments;
  }

  const sortedInvestments = [...displayInvestments].sort((a, b) => {
    const dateA = new Date(a.investment.invested_at).getTime();
    const dateB = new Date(b.investment.invested_at).getTime();
    return dateB - dateA;
  });
  const totalPages = Math.ceil(sortedInvestments.length / investmentsPerPage);
  const pagedInvestments = sortedInvestments.slice(
    (currentPage - 1) * investmentsPerPage,
    currentPage * investmentsPerPage
  );

  const handleWithdraw = () => {
    window.location.href = "/investor/settings?tab=billing";
  };

  // Pagination for profit payouts
  const totalProfitPayoutPages = Math.ceil(
    profitPayouts.length / profitPayoutsPerPage
  );
  const pagedProfitPayouts = profitPayouts.slice(
    (profitPayoutsPage - 1) * profitPayoutsPerPage,
    profitPayoutsPage * profitPayoutsPerPage
  );

  console.log("Portfolio user:", user);
  console.log("Portfolio accountBalance:", accountBalance);
  console.log("Portfolio totalInvested:", totalInvested);
  console.log("Portfolio totalReturns:", totalReturns);
  console.log("Portfolio overallROI:", overallROI);
  console.log("Portfolio investments:", investments);
  console.log("Portfolio investmentDetails:", investmentDetails);

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${accountBalance.toLocaleString()}
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={handleWithdraw}>
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invested
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalInvested.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalReturns.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From profit distributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall ROI</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span
                className={overallROI < 0 ? "text-red-600" : "text-green-600"}
              >
                {overallROI > 0 ? "+" : ""}
                {overallROI.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

  {/* Investment List */}
  <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                My Investments
              </CardTitle>
              <CardDescription>
                Track your investments and their performance over time
              </CardDescription>
            </div>

            <div className="flex gap-6 items-center">
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-muted-foreground mb-1">
                  Group By
                </span>
                <div className="flex rounded-md bg-muted/40 p-1 border border-muted-foreground/10">
                  <Button
                    size="sm"
                    variant={groupBy === "combined" ? "secondary" : "outline"}
                    className={`rounded-l-md rounded-r-none font-normal px-3 py-1 text-xs border-none shadow-none ${
                      groupBy === "combined"
                        ? "bg-black text-white !hover:bg-black !hover:text-white"
                        : ""
                    }`}
                    onClick={() => setGroupBy("combined")}
                    style={
                      groupBy === "combined" ? { pointerEvents: "none" } : {}
                    }
                  >
                    Combined by Pitch
                  </Button>
                  <Button
                    size="sm"
                    variant={groupBy === "all" ? "secondary" : "outline"}
                    className={`rounded-r-md rounded-l-none font-normal px-3 py-1 text-xs border-none shadow-none ${
                      groupBy === "all"
                        ? "bg-black text-white !hover:bg-black !hover:text-white"
                        : ""
                    }`}
                    onClick={() => setGroupBy("all")}
                    style={groupBy === "all" ? { pointerEvents: "none" } : {}}
                  >
                    Show All Investments
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-muted-foreground mb-1">
                  Status
                </span>
                <div className="flex rounded-md bg-muted/40 p-1 border border-muted-foreground/10">
                  <Button
                    size="sm"
                    variant={status === "active" ? "secondary" : "outline"}
                    className={`rounded-l-md font-normal px-3 py-1 text-xs border-none shadow-none ${
                      status === "active"
                        ? "bg-black text-white !hover:bg-black !hover:text-white"
                        : ""
                    }`}
                    onClick={() => setStatus("active")}
                    style={status === "active" ? { pointerEvents: "none" } : {}}
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "funded" ? "secondary" : "outline"}
                    className={`font-normal px-3 py-1 text-xs border-none shadow-none ${
                      status === "funded"
                        ? "bg-black text-white !hover:bg-black !hover:text-white"
                        : ""
                    }`}
                    onClick={() => setStatus("funded")}
                    style={status === "funded" ? { pointerEvents: "none" } : {}}
                  >
                    Funded
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "closed" ? "secondary" : "outline"}
                    className={`rounded-r-md font-normal px-3 py-1 text-xs border-none shadow-none ${
                      status === "closed"
                        ? "bg-black text-white !hover:bg-black !hover:text-white"
                        : ""
                    }`}
                    onClick={() => setStatus("closed")}
                    style={status === "closed" ? { pointerEvents: "none" } : {}}
                  >
                    Closed/Refunded
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isInvestmentsLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingScreen />
            </div>
          ) : investments.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
              <p className="text-muted-foreground mb-4">
                Start investing in promising businesses to build your portfolio
              </p>
              <Link href="/investor/browse-pitches">
                <Button>Browse Opportunities</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {pagedInvestments.map((item) => {
                  const {
                    investment,
                    pitch,
                    investmentReturns,
                    roi,
                    totalShares,
                  } = item;
                  if (!pitch) return null;
                  const isRefunded = investment.refunded === true;

                  // total
                  const shares =
                    typeof totalShares === "number"
                      ? totalShares
                      : typeof investment.investment_amount === "number"
                        ? investment.investment_amount * (typeof investment.tier?.multiplier === "number" ? investment.tier.multiplier : 1)
                        : undefined;

                  // group display
                  let showMultipleTier = false;
                  let showMultipleMultiplier = false;
                  let tierDisplay = investment.tier?.name;
                  let multiplierDisplay = investment.tier?.multiplier;
                  let dateDisplay = investment.invested_at;
                  let dateText = null;
                  if (groupBy === "combined") {
                    // all unique
                    const pitchId = pitch.id;
                    const allTiers = filteredInvestments
                      .filter(({ pitch }) => pitch && pitch.id === pitchId)
                      .map(({ investment }) => investment.tier?.name)
                      .filter(Boolean);
                    const allMultipliers = filteredInvestments
                      .filter(({ pitch }) => pitch && pitch.id === pitchId)
                      .map(({ investment }) => investment.tier?.multiplier)
                      .filter((m) => m !== undefined);
                    const allDates = filteredInvestments
                      .filter(({ pitch }) => pitch && pitch.id === pitchId)
                      .map(({ investment }) => investment.invested_at)
                      .filter(Boolean)
                      .map((d) => new Date(d));
                    const uniqueTiers = Array.from(new Set(allTiers));
                    const uniqueMultipliers = Array.from(
                      new Set(allMultipliers)
                    );
                    if (uniqueTiers.length > 1) showMultipleTier = true;
                    if (uniqueMultipliers.length > 1)
                      showMultipleMultiplier = true;
                    if (allDates.length > 1) {
                      allDates.sort((a, b) => a.getTime() - b.getTime());
                      const first = allDates[0];
                      const last = allDates[allDates.length - 1];
                      // Compare only Y/M/D, not time
                      const sameDay =
                        first.getFullYear() === last.getFullYear() &&
                        first.getMonth() === last.getMonth() &&
                        first.getDate() === last.getDate();
                      if (sameDay) {
                        dateText = formatDate(first);
                      } else {
                        dateText = `${formatDate(first)} - ${formatDate(last)}`;
                      }
                    } else if (allDates.length === 1) {
                      dateText = formatDate(allDates[0]);
                    }
                  }

                  return (
                    <Card
                      key={investment.id}
                      className={
                        isRefunded
                          ? "relative border-blue-200 shadow-md overflow-hidden"
                          : "bg-muted/30"
                      }
                    >
                      <CardContent className={isRefunded ? "pt-6" : "pt-6"}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {pitch.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {pitch.elevator_pitch}
                            </p>
                          </div>

                          {groupBy === "combined" && showMultipleTier ? (
                            <Badge className="bg-white text-black border-2 font-semibold">
                              Multiple Tiers
                            </Badge>
                          ) : (
                            <TierBadge tier={tierDisplay || ""} />
                          )}
                        </div>
                        <div className="grid md:grid-cols-5 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Investment Amount
                            </div>
                            <div className="font-semibold">
                              ${investment.investment_amount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Tier & Multiplier
                            </div>
                            <div className="font-semibold">
                              {groupBy === "combined" &&
                              (showMultipleTier || showMultipleMultiplier)
                                ? "Multiple"
                                : `${tierDisplay || ""} (${
                                    typeof multiplierDisplay === "number"
                                      ? multiplierDisplay
                                      : ""
                                  }x)`}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Investment Date
                            </div>
                            <div className="font-semibold">
                              {groupBy === "combined" && dateText
                                ? dateText
                                : formatDate(investment.invested_at)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Returns Received
                            </div>
                            <div className="font-semibold text-green-600">
                              ${investmentReturns.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Your Shares
                            </div>
                            <div className="font-semibold">
                              {typeof shares === "number"
                                ? shares.toLocaleString()
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t relative">
                          <div className="flex items-center justify-between">
                            <div
                              className={
                                isRefunded
                                  ? "relative z-40 text-sm text-muted-foreground pointer-events-auto"
                                  : "text-sm text-muted-foreground"
                              }
                            >
                              Pitch Status:{" "}
                              <Badge variant="default" className="ml-1">
                                {pitch.status}
                              </Badge>
                            </div>
                            <div
                              className={
                                isRefunded
                                  ? "relative z-40 pointer-events-auto"
                                  : ""
                              }
                            >
                              <Link href={`/investor/pitch/${pitch?.id}`}>
                                <Button variant="outline" size="sm">
                                  View Pitch Details
                                  <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                        {isRefunded && (
                          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                            <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-sm pointer-events-auto" />
                            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-4">
                              <span className="text-green-600 text-xl font-bold mb-1">
                                Refunded
                              </span>
                              <span className="text-gray-800 text-base mb-1">
                                Investment in{" "}
                                <span className="font-semibold">
                                  {pitch.title}
                                </span>{" "}
                                refunded.
                              </span>
                              <span className="text-gray-600 text-sm mb-1">
                                Business closed the pitch.
                              </span>
                              <span className="text-green-600 text-base font-semibold">
                                +$
                                {investment.refunded_amount?.toLocaleString?.() ??
                                  investment.investment_amount?.toLocaleString?.()}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profit Payouts
          </CardTitle>
          <CardDescription>
            All profit returns paid out to you from your investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProfitPayoutsLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingScreen />
            </div>
          ) : profitPayouts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No profit payouts yet
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedProfitPayouts.map(
                  ({ distribution, pitch, totalAmount, userSharePercent }) => (
                    <div
                      key={pitch.id + "-" + distribution.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          ${totalAmount.toLocaleString()} from {pitch?.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Paid on {formatDate(distribution.distribution_date)} •{" "}
                          {userSharePercent.toFixed(2)}% share
                        </div>
                      </div>
                      <Link href={`/investor/pitch/${pitch?.id}`}>
                        <Button size="sm" variant="outline">
                          View Pitch
                        </Button>
                      </Link>
                    </div>
                  )
                )}
              </div>

              {totalProfitPayoutPages > 1 && (
                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setProfitPayoutsPage((p) => Math.max(1, p - 1))
                    }
                    disabled={profitPayoutsPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Page {profitPayoutsPage} of {totalProfitPayoutPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setProfitPayoutsPage((p) =>
                        Math.min(totalProfitPayoutPages, p + 1)
                      )
                    }
                    disabled={profitPayoutsPage === totalProfitPayoutPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isInvestmentsLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingScreen />
            </div>
          ) : (
            <div className="space-y-3">
              {investmentDetails.slice(0, 3).map(({ investment, pitch }) => (
                <div
                  key={investment.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Invested in {pitch?.title}</div>
                    <div className="text-sm text-muted-foreground">
                      ${investment.investment_amount.toLocaleString()} •{" "}
                      {formatDate(investment.invested_at)}
                    </div>
                  </div>
                  <TierBadge tier={investment.tier?.name || "No Tier"} />
                </div>
              ))}

              {investments.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
