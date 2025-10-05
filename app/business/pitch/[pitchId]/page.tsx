

import { getPitchById } from "@/lib/data";

import { PitchDetailsCard } from "@/components/shared/pitch-details-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function BusinessPitchPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const pitch = await getPitchById(pitchId);

  if (!pitch) return <div className="p-8 text-red-500">Pitch not found.</div>;

  return (
    <PitchDetailsCard
      pitch={pitch}
      backButton={
        <Link href="/business">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      }
    />
  );
}

export const dynamic = "force-dynamic";