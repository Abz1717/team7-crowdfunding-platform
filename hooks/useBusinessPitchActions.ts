"use client";

import { useCallback } from "react";
import { mutate } from "swr";
import { createPitch, updatePitch, deletePitch } from "@/lib/action";
import {
  CreatePitchData,
  PitchFormData,
  AIAnalysis,
  UpdatePitchData,
} from "@/lib/types/pitch";
import { toast } from "sonner";

export function useBusinessPitchActions() {


  const createNewPitch = useCallback(
    async (
      formData: PitchFormData,
      aiAnalysis?: AIAnalysis,
      supportingMedia?: string[]
    ) => {
      try {
        if (!formData.endDate) {
          toast.error("End date is required");
          return { success: false };
        }

        const targetAmount = parseInt(formData.targetAmount) || 0;
        const profitShare = parseInt(formData.profitShare) || 0;

        if (targetAmount <= 0) {
          toast.error("Target amount must be greater than 0");
          return { success: false };
        }

        if (profitShare <= 0 || profitShare > 100) {
          toast.error("Profit share must be between 1 and 100%");
          return { success: false };
        }

        const pitchData: CreatePitchData = {
          title: formData.title,
          elevator_pitch: formData.elevatorPitch,
          detailed_pitch: formData.detailedPitch,
          target_amount: targetAmount,
          profit_share: profitShare,
          profit_distribution_frequency: formData.profitDistributionFrequency,
          tags: formData.tags,
          end_date: formData.endDate.toISOString(),
          investment_tiers: formData.tiers,
          ai_analysis: aiAnalysis,
          supporting_media: supportingMedia || [],
        };

        const result = await createPitch(pitchData);
        if (result.success && result.data) {
          toast.success("Pitch created successfully!");
          // Revalidate cached pitches
          await mutate("my-pitches");
          return { success: true, data: result.data };
        } else {
          toast.error(result.error || "Failed to create pitch");
          return { success: false };
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        return { success: false };
      }
    },
  []
  );

  const updateExistingPitch = useCallback(
    async (pitchId: string, updateData: UpdatePitchData) => {
      try {
        const result = await updatePitch(pitchId, updateData);
        if (result.success && result.data) {
          toast.success("Pitch updated successfully!");
          // Revalidate cached pitches
          await mutate("my-pitches");
          return { success: true, data: result.data };
        } else {
          toast.error(result.error || "Failed to update pitch");
          return { success: false };
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        return { success: false };
      }
    },
  []
  );

  const deleteExistingPitch = useCallback(
    async (pitchId: string) => {
      try {
        const result = await deletePitch(pitchId);
        if (result.success) {
          toast.success("Pitch deleted successfully!");
          // Revalidate  pitches
          await mutate("my-pitches");
          return { success: true };
        } else {
          toast.error(result.error || "Failed to delete pitch");
          return { success: false };
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        return { success: false };
      }
    },
  []
  );

  return {
    createNewPitch,
    updateExistingPitch,
    deleteExistingPitch,
  };
}
