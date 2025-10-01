"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PitchBrowser } from "@/components/investor/pitch-browser"
import { Navbar } from "@/components/layout/navbar"

export default function BusinessOtherPitches() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "business")) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user || user.role !== "business") {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Other Pitches</h1>
        <p className="text-muted-foreground">See what other businesses are pitching (investment disabled)</p>
      </div>
      <PitchBrowser />
    </div>
  )
}
