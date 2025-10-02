import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, TrendingUp, Users, Target } from "lucide-react";
import Image from "next/image";
import React from "react";

interface PitchDetailsCardProps {
  pitch: any;
  backButton?: React.ReactNode;
}

export function PitchDetailsCard({ pitch, backButton }: PitchDetailsCardProps) {
  const fundingProgress = (pitch.current_amount / pitch.target_amount) * 100;
  const endDate = typeof pitch.end_date === "string" ? new Date(pitch.end_date) : pitch.end_date;
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {backButton && (
        <div className="mb-4">
          {backButton}
        </div>
      )}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{pitch.title}</CardTitle>
                <CardDescription className="text-lg">{pitch.elevator_pitch}</CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-3 py-1">{pitch.status}</Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {pitch.supporting_media && pitch.supporting_media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Supporting Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(pitch.supporting_media as string[]).map((media: string, index: number) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={media || "/placeholder.svg"}
                        alt={`${pitch.title} media ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
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
                  <span className="text-2xl font-bold">{fundingProgress.toFixed(1)}%</span>
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
                  <div className="text-sm text-muted-foreground">Investment Window</div>
                  <div className="font-medium">{daysLeft > 0 ? `${daysLeft} days left` : "Expired"}</div>
                  <div className="text-sm text-muted-foreground">Ends {formatDate(pitch.end_date)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Target Amount</div>
                  <div className="font-medium">${pitch.target_amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Profit Share</div>
                  <div className="font-medium">{pitch.profit_share}% to investors</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">{formatDate(pitch.created_at)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
