import { getPitchById } from "@/lib/data";

import { PitchDetailsCard } from "@/components/shared/pitch-details-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function InvestorPitchPage({
  params,
}: {
  params: Promise<{ pitchId: string }>;
}) {
  const { pitchId } = await params;
  const pitch = await getPitchById(pitchId);

  if (!pitch) return <div className="p-8 text-red-500">Pitch not found.</div>;

  return (
    <PitchDetailsCard
      pitch={pitch}
      backButton={
        <Link href="/investor/portfolio">
          <Button variant="default" size="sm">
            Back to Portfolio
          </Button>
        </Link>
      }
    />
  );
}

export const dynamic = "force-dynamic";
