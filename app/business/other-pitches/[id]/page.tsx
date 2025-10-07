"use client"
import React from "react"

import { PitchDetailsClientWrapper } from "./ClientWrapper";

interface PageProps {
  params: Promise<{ id: string }>
}

export default function BusinessOtherPitchDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return <PitchDetailsClientWrapper pitchId={resolvedParams.id} />
}
