"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { CreatePitchDialog } from "@/components/business/create-pitch-dialog";
import { PitchCard } from "@/components/business/pitch-card";
import { EditPitchDialog } from "@/components/business/edit-pitch-dialog";
import { usePitch } from "@/context/PitchContext";
import { usePitchActions } from "@/hooks/usePitchActions";
import type { Pitch } from "@/lib/types/pitch";
import { toast } from "sonner";
import { DeclareProfitsDialog } from "@/components/business/declare-profits-dialog";

const PITCH_TABS = [
  { key: "draft", label: "Drafts" },
  { key: "active", label: "Active" },
  { key: "funded", label: "Funded" },
  { key: "closed", label: "Closed" },
];

export function MyPitches() {
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const { pitches, loading, error } = usePitch();
  const { loadPitches, deleteExistingPitch, updateExistingPitch } = usePitchActions();
  const [deletingPitchId, setDeletingPitchId] = useState<string | null>(null);
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profitsDialogOpen, setProfitsDialogOpen] = useState(false);
  const [declaringProfitsPitch, setDeclaringProfitsPitch] = useState<Pitch | null>(null);

  const handleDeclareProfits = (pitch: Pitch) => {
    setDeclaringProfitsPitch(pitch);
    setProfitsDialogOpen(true);
  };

  useEffect(() => {
    loadPitches(); 
  }, [loadPitches]);

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
            <CreatePitchDialog/>
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
            <CreatePitchDialog/>
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

  const pitchesByStatus = {
    draft: pitches.filter((p) => p.status === "draft"),
    active: pitches.filter((p) => p.status === "active"),
    funded: pitches.filter((p) => p.status === "funded"),
    closed: pitches.filter((p) => p.status === "closed"),
  };

  const handlePublishPitch = async (pitchId: string) => {
  const handleDeclareProfits = (pitch: Pitch) => {
    setDeclaringProfitsPitch(pitch);
    setProfitsDialogOpen(true);
  };
    try {
      await updateExistingPitch(pitchId, { status: "active" });
      toast.success("Pitch published and moved to Active");
      loadPitches();
    } catch (error) {
      toast.error("Failed to publish pitch");
    }
  };

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
          <CreatePitchDialog/>
        </div>

        <div className="mb-8 flex gap-2 border-b border-gray-200">
          {PITCH_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 focus:outline-none ${selectedTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-blue-600"}`}
              onClick={() => setSelectedTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedTab === "draft" && (
          <>
            <SectionHeading title="Drafts" />
            <SubcategoryDescription text="Draft pitches are not visible to investors. Publish when ready." />
            {pitchesByStatus.draft.length === 0 ? (
              <EmptySection message="No draft pitches. Create a new pitch." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                {pitchesByStatus.draft.map((pitch) => (
                  <div key={pitch.id}>
                    <PitchCard
                      pitch={pitch}
                      onEdit={handleEditPitch}
                      onDelete={handleDeletePitch}
                      onStatusToggle={() => {}}
                      isDeleting={deletingPitchId === pitch.id}
                    />
                    <Button
                      className="mt-2 w-full"
                      onClick={() => handlePublishPitch(pitch.id)}
                      variant="default"
                    >
                      Publish Pitch
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {selectedTab === "active" && (
          <>
            <SectionHeading title="Active" />
            <SubcategoryDescription text="Active pitches are open for investment and visible to investors." />
            {pitchesByStatus.active.length === 0 ? (
              <EmptySection message="No active pitches." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                {pitchesByStatus.active.map((pitch) => (
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
          </>
        )}
        {selectedTab === "funded" && (
          <>
            <SectionHeading title="Funded" />
            <SubcategoryDescription text="Funded pitches have reached their target and are ready for profit distribution." />
            {pitchesByStatus.funded.length === 0 ? (
              <EmptySection message="No funded pitches yet." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                {pitchesByStatus.funded.map((pitch) => (
                  <div key={pitch.id}>
                    <PitchCard
                      pitch={pitch}
                      onEdit={handleEditPitch}
                      onDelete={handleDeletePitch}
                      onStatusToggle={() => {}}
                      isDeleting={deletingPitchId === pitch.id}
                    />
                    <Button
                      className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleDeclareProfits(pitch)}
                      variant="default"
                    >
                      Declare Profits
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {selectedTab === "closed" && (
          <>
            <SectionHeading title="Closed" />
            <SubcategoryDescription text="Closed pitches are no longer accepting investments." />
            {pitchesByStatus.closed.length === 0 ? (
              <EmptySection message="No closed pitches." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                {pitchesByStatus.closed.map((pitch) => (
                  <PitchCard
                    key={pitch.id}
                    pitch={pitch}
                    onEdit={handleEditPitch}
                    onDelete={handleDeletePitch}
                    onStatusToggle={() => {}}
                    isDeleting={deletingPitchId === pitch.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <EditPitchDialog
          pitch={editingPitch}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onDelete={handleDeletePitch}
        />
        <DeclareProfitsDialog
          pitch={declaringProfitsPitch}
          open={profitsDialogOpen}
          onOpenChange={setProfitsDialogOpen}
        />
      </div>
    </div>
  );
function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">{title}</h2>;
}
function SubcategoryDescription({ text }: { text: string }) {
  return <p className="text-gray-500 mb-4">{text}</p>;
}

function EmptySection({ message }: { message: string }) {

  return (
    <div className="text-center py-8">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
}
