"use client";
import dynamic from "next/dynamic";
import React from "react";

const PitchDetailsView = dynamic(() => import("@/components/shared/pitch-details-view").then(mod => mod.PitchDetailsView), { ssr: false });

export function PitchDetailsClientWrapper({ pitchId }: { pitchId: string }) {
  return (
    <PitchDetailsView
      pitchId={pitchId}
      backHref="/business/other-pitches"
      showInvestmentForm={false}
    />
  );
}