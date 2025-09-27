import { PitchDetails } from "@/components/business/pitch-details";

interface PitchDetailsPageProps {
  params: {
    id: string;
  };
}

export default function PitchDetailsPage({ params }: PitchDetailsPageProps) {
  return <PitchDetails pitchId={params.id} />;
}
