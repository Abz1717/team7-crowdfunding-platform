"use client";

import { useCallback } from "react";
import { usePitch } from "@/context/PitchContext";
import {
  createPitch,
  getPitches,
  updatePitch,
  deletePitch,
} from "@/lib/action";
import {
  CreatePitchData,
  PitchFormData,
  AIAnalysis,
  UpdatePitchData,
} from "@/lib/types/pitch";
import { toast } from "sonner";

export function usePitchActions() {
  const { dispatch } = usePitch();

  const loadPitches = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await getPitches();
      if (result.success && result.data) {
        dispatch({ type: "SET_PITCHES", payload: result.data });
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: result.error || "Failed to load pitches",
        });
        toast.error(result.error || "Failed to load pitches");
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "An unexpected error occurred" });
      toast.error("An unexpected error occurred");
    }
  }, [dispatch]);

  const createNewPitch = useCallback(
    async (
      formData: PitchFormData,
      aiAnalysis?: AIAnalysis,
      supportingMedia?: string[]
    ) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        if (!formData.endDate) {
          dispatch({ type: "SET_ERROR", payload: "End date is required" });
          toast.error("End date is required");
          return { success: false };
        }

        const targetAmount = parseInt(formData.targetAmount) || 0;
        const profitShare = parseInt(formData.profitShare) || 0;

        if (targetAmount <= 0) {
          dispatch({
            type: "SET_ERROR",
            payload: "Target amount must be greater than 0",
          });
          toast.error("Target amount must be greater than 0");
          return { success: false };
        }

        if (profitShare <= 0 || profitShare > 100) {
          dispatch({
            type: "SET_ERROR",
            payload: "Profit share must be between 1 and 100%",
          });
          toast.error("Profit share must be between 1 and 100%");
          return { success: false };
        }

        const pitchData: CreatePitchData = {
          title: formData.title,
          elevator_pitch: formData.elevatorPitch,
          detailed_pitch: formData.detailedPitch,
          target_amount: targetAmount,
          profit_share: profitShare,
          end_date: formData.endDate.toISOString(),
          investment_tiers: formData.tiers,
          ai_analysis: aiAnalysis,
          supporting_media: supportingMedia || [],
        };

        const result = await createPitch(pitchData);
        if (result.success && result.data) {
          dispatch({ type: "ADD_PITCH", payload: result.data });
          toast.success("Pitch created successfully!");
          return { success: true, data: result.data };
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: result.error || "Failed to create pitch",
          });
          toast.error(result.error || "Failed to create pitch");
          return { success: false };
        }
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: "An unexpected error occurred",
        });
        toast.error("An unexpected error occurred");
        return { success: false };
      }
    },
    [dispatch]
  );

  const updateExistingPitch = useCallback(
    async (pitchId: string, updateData: UpdatePitchData) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const result = await updatePitch(pitchId, updateData);
        if (result.success && result.data) {
          dispatch({ type: "UPDATE_PITCH", payload: result.data });
          toast.success("Pitch updated successfully!");
          return { success: true, data: result.data };
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: result.error || "Failed to update pitch",
          });
          toast.error(result.error || "Failed to update pitch");
          return { success: false };
        }
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: "An unexpected error occurred",
        });
        toast.error("An unexpected error occurred");
        return { success: false };
      }
    },
    [dispatch]
  );

  const deleteExistingPitch = useCallback(
    async (pitchId: string) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const result = await deletePitch(pitchId);
        if (result.success) {
          dispatch({ type: "DELETE_PITCH", payload: pitchId });
          toast.success("Pitch deleted successfully!");
          return { success: true };
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: result.error || "Failed to delete pitch",
          });
          toast.error(result.error || "Failed to delete pitch");
          return { success: false };
        }
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: "An unexpected error occurred",
        });
        toast.error("An unexpected error occurred");
        return { success: false };
      }
    },
    [dispatch]
  );

  return {
    loadPitches,
    createNewPitch,
    updateExistingPitch,
    deleteExistingPitch,
  };
}
