"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PitchBrowser } from "@/components/investor/pitch-browser";
import LoadingScreen from "@/components/loading-screen";

export default function InvestorDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading && (!user || user.role !== "investor")) {
        router.push("/signin");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== "investor") {
    return <LoadingScreen />;
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
