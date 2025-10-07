"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { previewProfitDistribution, declareProfits } from "@/lib/action";
import type { Pitch } from "@/lib/types/pitch";
import { useBusiness } from "@/context/BusinessContext";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calculator,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProfitDeclarationFormProps {
  pitch: Pitch;
  onSuccess?: () => void;
}

export function ProfitDeclarationForm({
  pitch,
  onSuccess,
}: ProfitDeclarationFormProps) {
  const { profitDistributions, myPitches } = useBusiness();
  const [profitAmount, setProfitAmount] = useState<string>("");
  const [preview, setPreview] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDeclaring, setIsDeclaring] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultInfo, setResultInfo] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [lastDistribution, setLastDistribution] = useState<Date | null>(null);
  const [nextDistribution, setNextDistribution] = useState<Date | null>(null);
  const [firstAllowed, setFirstAllowed] = useState<Date | null>(null);

  // Get the latest pitch data from context to reflect DB trigger updates
  const latestPitch = useMemo(() => {
    return myPitches.find((p) => p.id === pitch.id) || pitch;
  }, [myPitches, pitch]);

  const nextFromPitch = useMemo(() => {
    return latestPitch.next_profit_distribution_at
      ? new Date(latestPitch.next_profit_distribution_at)
      : null;
  }, [latestPitch.next_profit_distribution_at]);

  // Use cached profit distributions from BusinessContext
  useEffect(() => {
    // Get distributions for this specific pitch from cached data
    const pitchDists = profitDistributions.find(
      (pd) => pd.pitchId === pitch.id
    );
    const dists = pitchDists?.distributions || [];

    console.log(
      `[ProfitDeclarationForm] Using CACHED data for pitch ${pitch.id}: ${dists.length} distributions`
    );

    if (dists && dists.length > 0) {
      const sortedDists = [...dists].sort(
        (a, b) =>
          new Date(b.distribution_date).getTime() -
          new Date(a.distribution_date).getTime()
      );
      const last = new Date(sortedDists[0].distribution_date);
      setLastDistribution(last);
      const next = nextFromPitch ?? new Date(last);
      if (!nextFromPitch) {
        next.setMonth(next.getMonth() + 0);
      }
      setNextDistribution(next);
      setFirstAllowed(null);
    } else {
      setFirstAllowed(nextFromPitch ?? new Date());
      setLastDistribution(null);
      setNextDistribution(nextFromPitch);
    }
  }, [pitch.id, profitDistributions, latestPitch.next_profit_distribution_at]);

  const handlePreview = async () => {
    const amount = Number.parseFloat(profitAmount);
    if (!amount || amount <= 0) {
      toast.error("Invalid amount. Please enter a valid profit amount");
      return;
    }

    setIsCalculating(true);
    try {
      const result = await previewProfitDistribution(pitch.id, amount);
      if (result.success) {
        setPreview(result.data);
      } else {
        toast.error(
          result.error || "Unable to calculate profit distribution preview"
        );
      }
    } catch (error) {
      console.error("[v0] Error calculating preview:", error);
      toast.error("Unable to calculate profit distribution preview");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDeclare = async () => {
    if (!preview) return;

    setIsDeclaring(true);
    try {
      const profitToDeclare =
        preview.total_profit ?? Number.parseFloat(profitAmount);
      console.log("[DEBUG] Declaring profits for pitch:", pitch);
      console.log("[DEBUG] Profit amount to declare:", profitToDeclare);
      const result = await declareProfits(pitch.id, profitToDeclare);
      console.log("[DEBUG] declareProfits result:", result);
      if (result.success) {
        setResultInfo({
          success: true,
          message: `Profits declared successfully! $${
            preview.total_to_investors?.toLocaleString?.() ?? profitToDeclare
          } distributed to ${preview.investor_count ?? "?"} investor${
            preview.investor_count !== 1 ? "s" : ""
          }`,
        });
        setShowResultModal(true);
      } else {
        let errorMsg =
          result.error || "Unable to declare profits. Please try again.";
        if (
          result.error &&
          result.error.toLowerCase().includes("insufficient account balance")
        ) {
          errorMsg =
            "Insufficient account balance. Please deposit more funds before declaring this profit amount.";
        }
        setResultInfo({
          success: false,
          message: errorMsg,
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("[v0] Error declaring profits:", error);
      setResultInfo({
        success: false,
        message: "Unable to declare profits. Please try again.",
      });
      setShowResultModal(true);
    } finally {
      setIsDeclaring(false);
    }
  };

  return (
    <>
      <Dialog
        open={showResultModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowResultModal(false);
            if (resultInfo?.success && onSuccess) onSuccess();
          }
        }}
      >
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {resultInfo?.success ? "Success" : "Error"}
            </DialogTitle>
            <DialogDescription>{resultInfo?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowResultModal(false);
                if (resultInfo?.success && onSuccess) onSuccess();
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Declare Profits
            </CardTitle>
            <CardDescription>
              Enter the total profit amount to distribute to investors based on
              their investment tiers
            </CardDescription>
            <div className="mt-4 space-y-1">
              <div>
                <span className="font-medium">Last Profit Distribution: </span>
                {lastDistribution
                  ? lastDistribution.toLocaleDateString()
                  : "None yet"}
              </div>
              <div>
                <span className="font-medium">
                  Next Allowed Profit Distribution:{" "}
                </span>
                {nextDistribution
                  ? nextDistribution.toLocaleDateString()
                  : firstAllowed
                  ? firstAllowed.toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profitAmount">Total Profit Amount ($)</Label>
              <div className="flex gap-2">
                <Input
                  id="profitAmount"
                  type="number"
                  placeholder="10000"
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Button
                  onClick={handlePreview}
                  disabled={isCalculating || !profitAmount}
                >
                  {isCalculating ? (
                    <>
                      <Calculator className="mr-2 h-4 w-4 animate-pulse" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total to Investors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {preview?.total_to_investors?.toLocaleString?.()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {preview?.profit_share_percentage}% of total profit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Business Keeps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {preview?.business_keeps?.toLocaleString?.()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(100 - (preview?.profit_share_percentage ?? 0)).toFixed(1)}%
                  of total profit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Investors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {preview?.investor_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total invested: {preview?.total_invested?.toLocaleString?.()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Investor Payouts
                </CardTitle>
                <CardDescription>
                  Breakdown of returns for each investor based on their
                  investment tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {preview?.investor_payouts?.map?.(
                    (payout: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="font-medium">
                              Investor {index + 1}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Investment:{" "}
                            {payout.investment_amount?.toLocaleString?.()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {payout.amount?.toLocaleString?.()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payout.percentage?.toFixed?.(2)}% of total
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {(() => {
              const isNotDue = nextDistribution
                ? new Date() < nextDistribution
                : false;
              const isOverdue = nextDistribution
                ? new Date().getTime() - nextDistribution.getTime() >
                  24 * 60 * 60 * 1000
                : false;

              return (
                <Card
                  className={`${
                    isNotDue
                      ? "bg-gray-50 border-gray-300"
                      : isOverdue
                      ? "bg-red-50 border-red-300"
                      : "bg-green-50 border-green-300"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        {nextDistribution ? (
                          new Date() < nextDistribution ? (
                            <>
                              <h4 className="font-semibold mb-1 text-gray-700">
                                Not due yet
                              </h4>
                              <p className="text-sm text-gray-600">
                                You must declare profits on{" "}
                                {nextDistribution.toLocaleDateString()}. You
                                can't do it right now.
                              </p>
                            </>
                          ) : (
                            (() => {
                              const overdue =
                                new Date().getTime() -
                                  nextDistribution.getTime() >
                                24 * 60 * 60 * 1000;
                              return (
                                <>
                                  <h4
                                    className={`font-semibold mb-1 ${
                                      overdue
                                        ? "text-red-700"
                                        : "text-green-700"
                                    }`}
                                  >
                                    {overdue
                                      ? "Profit declaration overdue"
                                      : "Profit declaration due"}
                                  </h4>
                                  <p
                                    className={`text-sm ${
                                      overdue
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {overdue
                                      ? `Was due on ${nextDistribution.toLocaleDateString()}. Please declare as soon as possible.`
                                      : `Due on ${nextDistribution.toLocaleDateString()}. You may declare profits now.`}
                                  </p>
                                </>
                              );
                            })()
                          )
                        ) : (
                          <>
                            <h4 className="font-semibold mb-1 text-green-700">
                              Declare profits
                            </h4>
                            <p className="text-sm text-green-600">
                              This will distribute{" "}
                              {preview?.total_to_investors?.toLocaleString?.()}{" "}
                              to {preview?.investor_count} investor
                              {preview?.investor_count !== 1 ? "s" : ""}
                            </p>
                          </>
                        )}
                      </div>
                      <Button
                        size="lg"
                        onClick={handleDeclare}
                        disabled={
                          isDeclaring ||
                          (nextDistribution
                            ? new Date() < nextDistribution
                            : false)
                        }
                        className={
                          isOverdue ? "bg-red-600 hover:bg-red-700" : ""
                        }
                      >
                        {isDeclaring ? (
                          <>
                            <TrendingUp className="mr-2 h-4 w-4 animate-pulse" />
                            Declaring...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Declare Profits
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
