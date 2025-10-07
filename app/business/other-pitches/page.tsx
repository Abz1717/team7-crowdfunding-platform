"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useOtherPitches } from "@/hooks/useBusinessData";
import { useBusinessUser } from "@/hooks/useBusinessUser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pitch } from "@/lib/types/pitch";
import Link from "next/link";
import { LinkWithLoader } from "@/components/link-with-loader";
import {
  Search,
  Filter,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";


export default function BusinessOtherPitches() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { data: otherPitches, isLoading: loadingOtherPitches } = useOtherPitches();
  const { businessUser } = useBusinessUser(user ?? undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");


  // Redirect if not a business user 
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "business")) {
      router.push("/signin");
    }
  }, [isLoading, user, router]);
  if (!isLoading && (!user || user.role !== "business")) {
    return null;
  }



  if (isLoading || loadingOtherPitches || !otherPitches) {
    return null;
  }



  const filteredPitches = otherPitches
    .filter((pitch) => {
      const matchesSearch =
        pitch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.elevator_pitch.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "high-return" && pitch.profit_share >= 15) ||
        (filterBy === "low-risk" && pitch.profit_share <= 10) ||
        (filterBy === "almost-funded" &&
          pitch.current_amount / pitch.target_amount >= 0.75);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "funding-progress":
          return (
            b.current_amount / b.target_amount -
            a.current_amount / a.target_amount
          );
        case "profit-share":
          return b.profit_share - a.profit_share;
        case "target-amount":
          return b.target_amount - a.target_amount;
        default:
          return 0;
      }
    });

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dateObj);
  };

  const getDaysLeft = (endDate: string | Date) => {
    const dateObj = typeof endDate === "string" ? new Date(endDate) : endDate;
    const daysLeft = Math.ceil(
      (dateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysLeft);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Other Pitches</h1>
        <p className="text-muted-foreground">
          See what other businesses are pitching (investment disabled)
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Discover Other Business Pitches
            </CardTitle>
            <CardDescription>
              Browse active pitches from other businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search pitches by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="funding-progress">
                    Funding Progress
                  </SelectItem>
                  <SelectItem value="profit-share">Profit Share %</SelectItem>
                  <SelectItem value="target-amount">Target Amount</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pitches</SelectItem>
                  <SelectItem value="high-return">
                    High Return (15%+)
                  </SelectItem>
                  <SelectItem value="low-risk">Conservative (≤10%)</SelectItem>
                  <SelectItem value="almost-funded">
                    Almost Funded (75%+)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPitches.length} of {otherPitches.length} active pitches
          </p>
        </div>

        <div className="grid gap-6">
          {filteredPitches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-16 h-16 bg-muted mb-4 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No pitches found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPitches.map((pitch) => {
              const fundingProgress =
                (pitch.current_amount / pitch.target_amount) * 100;
              const daysLeft = getDaysLeft(pitch.end_date);
              const isMine = businessUser && pitch.business_id === businessUser.id;

              return (
                <Card
                  key={pitch.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {pitch.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {pitch.elevator_pitch}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <Badge variant="default">
                          {pitch.profit_share}% Shares
                        </Badge>
                        {isMine && (
                          <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full font-semibold text-xs mt-2 align-middle shadow">
                            My Pitch
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-6 mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Funding Progress
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>
                              ${pitch.current_amount.toLocaleString()}
                            </span>
                            <span>${pitch.target_amount.toLocaleString()}</span>
                          </div>
                          <Progress value={fundingProgress} className="h-2" />
                          <div className="text-sm font-medium">
                            {fundingProgress.toFixed(1)}% funded
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Time Remaining
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">
                            {daysLeft} days left
                          </div>
                          <div className="text-muted-foreground">
                            Ends {formatDate(pitch.end_date)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          Investment Tiers
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">
                            {pitch.investment_tiers.length} tiers available
                          </div>
                          <div className="text-muted-foreground">
                            From $
                            {pitch.investment_tiers[0]?.minAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Status
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">
                            {fundingProgress >= 100
                              ? "Fully Funded"
                              : "Open for Investment"}
                          </div>
                          <div className="text-muted-foreground">
                            Created {formatDate(pitch.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <LinkWithLoader href={`/business/other-pitches/${pitch.id}`}>
                      <Button>View Details</Button>
                    </LinkWithLoader>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
