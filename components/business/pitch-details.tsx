"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  MapPin,
  Globe,
  Mail,
  ExternalLink,
} from "lucide-react";
import { getPitchById } from "@/lib/action";
import type { Pitch } from "@/lib/types/pitch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ExtendedPitch = Pitch & {
  business_name?: string;
  business_description?: string | null;
  business_website?: string | null;
  business_logo_url?: string | null;
  business_location?: string | null;
  is_owner?: boolean;
};

interface PitchDetailsProps {
  pitchId: string;
}

export function PitchDetails({ pitchId }: PitchDetailsProps) {
  const [pitch, setPitch] = useState<ExtendedPitch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();

  const loadPitch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPitchById(pitchId);
      if (result.success && result.data) {
        setPitch(result.data);
      } else {
        setError(result.error || "Failed to load pitch details");
        toast.error(result.error || "Failed to load pitch details");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPitch();
  }, [pitchId]);

  const formatAmount = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const nextImage = () => {
    if (pitch?.supporting_media && pitch.supporting_media.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === pitch.supporting_media!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (pitch?.supporting_media && pitch.supporting_media.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? pitch.supporting_media!.length - 1 : prev - 1
      );
    }
  };

  const handleEditPitch = () => {
    router.push("/business/my-pitches");
    toast.info("Redirected to My Pitches to edit your pitch");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading pitch details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pitch) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">
                  {error || "Pitch not found"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={loadPitch}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage =
    pitch.target_amount > 0
      ? (pitch.current_amount / pitch.target_amount) * 100
      : 0;
  const daysLeft = Math.ceil(
    (new Date(pitch.end_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Button>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {pitch.business_logo_url ? (
                      <img
                        src={pitch.business_logo_url}
                        alt={`${pitch.business_name} logo`}
                        className="h-10 w-10 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {pitch.business_name}
                        </span>
                        {pitch.is_owner && (
                          <Badge variant="secondary" className="text-xs">
                            Your Pitch
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {pitch.business_location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{pitch.business_location}</span>
                          </div>
                        )}
                        {pitch.business_website && (
                          <a
                            href={pitch.business_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {pitch.title}
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {pitch.elevator_pitch}
                  </p>
                </div>
                {pitch.is_owner && (
                  <Button onClick={handleEditPitch} className="ml-4">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Pitch
                  </Button>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatAmount(pitch.target_amount)}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">
                    Target Amount
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatAmount(pitch.current_amount)}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">
                    Raised So Far
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {pitch.profit_share}%
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">
                    Profit Share
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {daysLeft > 0 ? daysLeft : 0}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">
                    Days Left
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {progressPercentage.toFixed(1)}% funded
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          {(pitch.business_description) && (
            <Card>
              <CardHeader>
                <CardTitle>About {pitch.business_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pitch.business_description && (
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        {pitch.business_description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media Gallery */}
          {pitch.supporting_media && pitch.supporting_media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="relative h-96 overflow-hidden rounded-lg">
                    {/* Blurred Background */}
                    <div className="absolute inset-0">
                      <img
                        src={
                          pitch.supporting_media[currentImageIndex] ||
                          "/placeholder.svg"
                        }
                        alt=""
                        className="w-full h-full object-cover blur-sm scale-110 opacity-60"
                      />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* Main Image */}
                    <img
                      src={
                        pitch.supporting_media[currentImageIndex] ||
                        "/placeholder.svg"
                      }
                      alt={`${pitch.title} - Image ${currentImageIndex + 1}`}
                      className="relative w-full h-full object-contain z-10"
                    />

                    {/* Navigation */}
                    {pitch.supporting_media.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/20 hover:bg-black/40 text-white z-20"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/20 hover:bg-black/40 text-white z-20"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>

                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                          {pitch.supporting_media.map((_, index) => (
                            <div
                              key={index}
                              className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                                index === currentImageIndex
                                  ? "bg-white"
                                  : "bg-white/50"
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Pitch */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Pitch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {pitch.detailed_pitch}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Tiers */}
          {pitch.investment_tiers && pitch.investment_tiers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Investment Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {pitch.investment_tiers.map((tier, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">
                          {tier.name} Tier
                        </h4>
                        <div className="text-sm text-gray-600">
                          {tier.multiplier}x multiplier
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Min Amount:
                          </span>
                          <span className="ml-2 text-blue-600 font-semibold">
                            {formatAmount(Number(tier.minAmount) || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Max Amount:
                          </span>
                          <span className="ml-2 text-blue-600 font-semibold">
                            {formatAmount(Number(tier.maxAmount) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {pitch.ai_analysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pitch.ai_analysis.strengths &&
                    pitch.ai_analysis.strengths.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {pitch.ai_analysis.strengths.map(
                            (strength, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start"
                              >
                                <span className="text-green-500 mr-2">•</span>
                                {strength}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {pitch.ai_analysis.recommendations &&
                    pitch.ai_analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2">
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {pitch.ai_analysis.recommendations.map(
                            (recommendation, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start"
                              >
                                <span className="text-blue-500 mr-2">•</span>
                                {recommendation}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {pitch.ai_rating && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">
                          AI Rating
                        </span>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {pitch.ai_rating}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pitch Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(pitch.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Campaign Ends
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(pitch.end_date)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
