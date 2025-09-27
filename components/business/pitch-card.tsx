"use client";
import { useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Edit,
  Trash2,
  Target,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  MapPin,
} from "lucide-react";
import type { Pitch } from "@/lib/types/pitch";

interface PitchCardProps {
  pitch: Pitch & {
    business_name?: string;
    business_description?: string | null;
    business_website?: string | null;
    business_logo_url?: string | null;
    business_location?: string | null;
    is_owner?: boolean;
  };
  onEdit?: (pitchId: string) => void;
  onDelete?: (pitchId: string) => void;
  onStatusToggle?: (pitchId: string, currentStatus: string) => void;
  onView?: (pitchId: string) => void;
  isDeleting?: boolean;
  showBusinessName?: boolean;
  mode?: "browse" | "manage";
}

export function PitchCard({
  pitch,
  onEdit,
  onDelete,
  onStatusToggle,
  onView,
  isDeleting = false,
  showBusinessName = false,
  mode = "manage",
}: PitchCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatAmount = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  const getAmountFontSize = (amount: number) => {
    const amountStr = amount.toLocaleString();
    if (amountStr.length > 8) return "text-lg"; // Very large numbers (e.g., £1,000,000+)
    if (amountStr.length > 6) return "text-xl"; // Large numbers (e.g., £100,000+)
    return "text-2xl"; // Normal size (e.g., £1,000 - £99,999)
  };

  const progressPercentage =
    pitch.target_amount > 0
      ? (pitch.current_amount / pitch.target_amount) * 100
      : 0;
  const daysLeft = Math.ceil(
    (new Date(pitch.end_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pitch.supporting_media && pitch.supporting_media.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === pitch.supporting_media!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pitch.supporting_media && pitch.supporting_media.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? pitch.supporting_media!.length - 1 : prev - 1
      );
    }
  };

  const handleCardClick = () => {
    if (mode === "browse" && onView) {
      onView(pitch.id);
    } else if (mode === "manage" && onEdit) {
      onEdit(pitch.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(pitch.id);
    }
  };

  return (
    <>
      <Card
        className="group relative border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white cursor-pointer overflow-hidden p-0"
        onClick={handleCardClick}
      >
        {/* Image Slider Section */}
        {pitch.supporting_media && pitch.supporting_media.length > 0 ? (
          <div className="relative h-68 overflow-hidden">
            {/* Blurred Background */}
            <div className="absolute inset-0">
              <img
                src={
                  pitch.supporting_media[currentImageIndex] ||
                  "/placeholder.svg"
                }
                alt=""
                className="w-full h-full object-cover blur-xs scale-110 opacity-60"
              />
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Main Image */}
            <img
              src={
                pitch.supporting_media[currentImageIndex] || "/placeholder.svg"
              }
              alt={`${pitch.title} - Image ${currentImageIndex + 1}`}
              className="relative w-full h-full object-contain z-10"
            />

            {/* Image Navigation */}
            {pitch.supporting_media.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  onClick={prevImage}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  onClick={nextImage}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Image Indicators */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  {pitch.supporting_media.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          // Placeholder when no images
          <div className="relative h-68 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No images</p>
            </div>
          </div>
        )}

        <CardContent className="p-6 space-y-4">
          {/* Business Info (if shown) */}
          {showBusinessName && pitch.business_name && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                {pitch.business_logo_url ? (
                  <img
                    src={pitch.business_logo_url}
                    alt={`${pitch.business_name} logo`}
                    className="h-6 w-6 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-4 w-4 text-gray-600" />
                )}
                <span className="font-medium text-gray-900">
                  {pitch.business_name}
                </span>
                {pitch.is_owner && (
                  <Badge variant="secondary" className="text-xs">
                    Your Pitch
                  </Badge>
                )}
              </div>
              {pitch.business_location && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{pitch.business_location}</span>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
              {pitch.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
              {pitch.elevator_pitch}
            </p>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div
                className={`${getAmountFontSize(
                  pitch.target_amount
                )} font-bold text-gray-900`}
              >
                {formatAmount(pitch.target_amount)}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Target
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {pitch.profit_share || 0}%
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Profit Share
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {formatAmount(pitch.current_amount)} raised
              </span>
              <span className="text-gray-500">
                {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-gray-500 text-center">
              {progressPercentage.toFixed(1)}% funded
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {mode === "browse" ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCardClick}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCardClick}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}

            {/* Show edit button for owned pitches in browse mode */}
            {mode === "browse" && pitch.is_owner && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(pitch.id);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Pitch"
        description={`Are you sure you want to delete "${pitch.title}"? This action cannot be undone and will permanently remove the pitch and all its data.`}
        confirmText="Delete Pitch"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
