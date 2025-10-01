"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getPitchById } from "@/lib/data"
import type { InvestmentTier } from "@/lib/types"
import type { Pitch } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Users, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import React from "react"

import { PitchDetailsClientWrapper } from "./ClientWrapper";

interface PageProps {
  params: Promise<{ id: string }>
}

export default function BusinessOtherPitchDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return <PitchDetailsClientWrapper pitchId={resolvedParams.id} />
}
