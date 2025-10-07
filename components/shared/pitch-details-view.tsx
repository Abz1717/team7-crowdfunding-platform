"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPitchById } from "@/lib/data";
import type { InvestmentTier } from "@/lib/types";
import type { Pitch } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InvestmentForm } from "@/components/investor/investment-form";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Target,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React from "react";

interface PitchDetailsViewProps {
  pitchId: string;
  backHref: string;
  showInvestmentForm: boolean;
}

export function PitchDetailsView({
  pitchId,
  backHref,
  showInvestmentForm,
}: PitchDetailsViewProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [isPitchLoading, setIsPitchLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPitch = async () => {
    if (!isLoading && !user) {
      setPitch(null);
      setIsPitchLoading(false);
      return;
    }
    setIsPitchLoading(true);
    const foundPitch = await getPitchById(pitchId);
    setPitch(foundPitch);
    setIsPitchLoading(false);
  };

  useEffect(() => {
    fetchPitch();
  }, [user, isLoading, pitchId]);

  if (isLoading || user === undefined || user === null || isPitchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600 font-bold">
        <div>Error: Pitch not found or unavailable</div>
        <div className="bg-gray-100 text-black p-4 mt-4 rounded w-full max-w-2xl text-xs text-left overflow-x-auto">
          <strong>pitchId:</strong> <pre>{String(pitchId)}</pre>
          <strong>user:</strong> <pre>{JSON.stringify(user, null, 2)}</pre>
          <strong>pitch:</strong> <pre>{JSON.stringify(pitch, null, 2)}</pre>
        </div>
      </div>
    );
  }

  const fundingProgress = (pitch.current_amount / pitch.target_amount) * 100;
  const endDate =
    typeof pitch.end_date === "string"
      ? new Date(pitch.end_date)
      : pitch.end_date;
  const daysLeft = Math.ceil(
    (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const canInvest = user.role === "investor";

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opportunities
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{pitch.title}</CardTitle>
                  <CardDescription className="text-lg">
                    {pitch.elevator_pitch}
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {pitch.profit_share}% Shares
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {pitch.supporting_media && pitch.supporting_media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Supporting Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(pitch.supporting_media as string[]).map(
                    (media: string, index: number) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden"
                      >
                        <Image
                          src={media || "/placeholder.svg"}
                          alt={`${pitch.title} media ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Business Case</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{pitch.detailed_pitch}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Investment Tiers
              </CardTitle>
              <CardDescription>
                Higher tiers receive increased profit share multipliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const normalizedTiers = (pitch.investment_tiers as any[]).map(
                  (tier) => ({
                    ...tier,
                    min_amount:
                      typeof tier.min_amount === "number"
                        ? tier.min_amount
                        : Number(tier.minAmount ?? 0),

                    max_amount:
                      typeof tier.max_amount === "number"
                        ? tier.max_amount
                        : Number(tier.maxAmount ?? 0),

                    multiplier:
                      typeof tier.multiplier === "number"
                        ? tier.multiplier
                        : Number(tier.multiplier ?? 1),
                    name: tier.name,
                  })
                );

                return (
                  <div className="grid md:grid-cols-2 gap-4">
                    {normalizedTiers.map(
                      (tier: InvestmentTier, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant={index === 0 ? "secondary" : "default"}
                            >
                              {tier.name}
                            </Badge>
                            <span className="text-lg font-bold">
                              {tier.multiplier}x
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {`$${
                              typeof tier.min_amount === "number" &&
                              !isNaN(tier.min_amount)
                                ? tier.min_amount.toLocaleString()
                                : "0"
                            } - ${
                              typeof tier.max_amount === "number" &&
                              !isNaN(tier.max_amount)
                                ? tier.max_amount === Number.POSITIVE_INFINITY
                                  ? "∞"
                                  : `$${tier.max_amount.toLocaleString()}`
                                : ""
                            }`}
                          </div>
                          {tier.multiplier > 1.0 && (
                            <div className="text-sm">
                              <div className="font-medium text-green-600">
                                {`Get up to ${Math.round(
                                  (tier.multiplier - 1) * 100
                                )}% more shares`}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Funding Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>${pitch.current_amount.toLocaleString()}</span>
                  <span>${pitch.target_amount.toLocaleString()}</span>
                </div>
                <Progress value={fundingProgress} className="h-3" />
                <div className="text-center">
                  <span className="text-2xl font-bold">
                    {fundingProgress.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">funded</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Investment Window
                  </div>
                  <div className="font-medium">
                    {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ends {formatDate(pitch.end_date)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Target Amount
                  </div>
                  <div className="font-medium">
                    ${pitch.target_amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Profit Share
                  </div>
                  <div className="font-medium">
                    {pitch.profit_share}% to investors
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">
                    {formatDate(pitch.created_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Only show investment form if allowed */}
          {showInvestmentForm && pitch.status === "active" && daysLeft > 0 && (
            <InvestmentForm
              pitch={pitch}
              canInvest={canInvest}
              onInvestmentComplete={async () => {
                setIsRefreshing(true);
                await fetchPitch();
                setIsRefreshing(false);
              }}
            />
          )}

          {/* Message if not investable */}
          {(!showInvestmentForm ||
            pitch.status !== "active" ||
            daysLeft <= 0) && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  {pitch.status !== "active"
                    ? "This pitch is no longer accepting investments"
                    : !showInvestmentForm
                    ? "Investment is disabled for your account type"
                    : "Investment window has closed"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
