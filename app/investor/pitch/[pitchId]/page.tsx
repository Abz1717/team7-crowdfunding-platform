"use client";

import { getPitchById } from "@/lib/data";
import { PitchDetailsCard } from "@/components/shared/pitch-details-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LoadingScreen from "@/components/loading-screen";
import React, { useEffect, useState } from "react";


export default function InvestorPitchPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = React.use(params);
  const [pitch, setPitch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPitchById(pitchId)
      .then((data) => {
        setPitch(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Pitch not found.");
        setLoading(false);
      });
  }, [pitchId]);

  if (loading) return <LoadingScreen />;
  if (error || !pitch) return <div className="p-8 text-red-500">Pitch not found.</div>;

  return (
    <PitchDetailsCard
      pitch={pitch}
      backButton={
        <Link href="/investor/portfolio">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Button>
        </Link>
      }
    />
  );
}



export const dynamic = "force-dynamic";
