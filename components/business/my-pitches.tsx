"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, BarChart3, RefreshCw } from "lucide-react";
import { CreatePitchDialog } from "@/components/business/create-pitch-dialog";
import { PitchCard } from "@/components/business/pitch-card";
import { EditPitchDialog } from "@/components/business/edit-pitch-dialog";
import { usePitch } from "@/context/PitchContext";
import { usePitchActions } from "@/hooks/usePitchActions";
import type { Pitch } from "@/lib/types/pitch";
import { toast } from "sonner";

export function MyPitches() {
  const { pitches, loading, error } = usePitch();
  const { loadPitches, refreshPitches, deleteExistingPitch, updateExistingPitch } =
    usePitchActions();
  const [deletingPitchId, setDeletingPitchId] = useState<string | null>(null);
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadPitches(); // Smart caching - only fetches if needed
  }, [loadPitches]);
  const handlePitchCreated = (newPitch: Pitch) => {
    // The pitch is automatically added to the context via the hook
  };

  const handleEditPitch = (pitchId: string) => {
    const pitch = pitches.find((p) => p.id === pitchId);
    if (pitch) {
      setEditingPitch(pitch);
      setEditDialogOpen(true);
    }
  };

  const handleStatusToggle = async (pitchId: string, currentStatus: string) => {
    const newStatus = currentStatus === "draft" ? "active" : "draft";

    try {
      await updateExistingPitch(pitchId, { status: newStatus });
      toast.success(`Pitch status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update pitch status");
    }
  };

  const handleDeletePitch = async (pitchId: string) => {
    if (deletingPitchId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this pitch? This action cannot be undone."
    );

    if (!confirmDelete) return;

    setDeletingPitchId(pitchId);
    try {
      await deleteExistingPitch(pitchId);
    } finally {
      setDeletingPitchId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 text-balance">
                Investment Pitches
              </h1>
              <p className="text-lg text-gray-600 text-pretty">
                Manage your investment opportunities and track funding progress
              </p>
            </div>
            <CreatePitchDialog onCreated={handlePitchCreated} />
          </div>
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading pitches...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 text-balance">
                Investment Pitches
              </h1>
              <p className="text-lg text-gray-600 text-pretty">
                Manage your investment opportunities and track funding progress
              </p>
            </div>
            <CreatePitchDialog onCreated={handlePitchCreated} />
          </div>
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Error Loading Pitches
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
            <Button
              onClick={loadPitches}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 text-balance">
              Investment Pitches
            </h1>
            <p className="text-lg text-gray-600 text-pretty">
              Manage your investment opportunities and track funding progress
            </p>
          </div>
          <CreatePitchDialog onCreated={handlePitchCreated} />
        </div>

        {pitches.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-8">
              <BarChart3 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              No pitches yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-pretty">
              Create your first investment pitch to start attracting investors
              and building your business.
            </p>
            <CreatePitchDialog onCreated={handlePitchCreated} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {pitches.map((pitch) => (
              <PitchCard
                key={pitch.id}
                pitch={pitch}
                onEdit={handleEditPitch}
                onDelete={handleDeletePitch}
                onStatusToggle={handleStatusToggle}
                isDeleting={deletingPitchId === pitch.id}
              />
            ))}
          </div>
        )}

        <EditPitchDialog
          pitch={editingPitch}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onDelete={handleDeletePitch}
        />
      </div>
    </div>
  );
}
