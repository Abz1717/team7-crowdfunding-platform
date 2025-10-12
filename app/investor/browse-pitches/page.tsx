"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PitchBrowser } from "@/components/investor/pitch-browser";

export default function InvestorDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  if (!user) {
    return <div className="container mx-auto py-8 px-4">Loading user...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Pitches</h1>
        <p className="text-muted-foreground">
          Discover new investment opportunities
        </p>
      </div>

      <PitchBrowser />
    </div>
  );
}
