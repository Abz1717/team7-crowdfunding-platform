"use client";

import { BusinessSetupForm } from "@/components/business-setup-form";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/loading-screen";

export function BusinessSetupPageClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== "business") {
      router.push("/");
    }
    if (!isLoading && !user) {
      const cookies = document.cookie.split(';');
      const userRoleCookie = cookies.find(cookie => cookie.trim().startsWith('user_role='));
      if (!userRoleCookie || !userRoleCookie.includes('business')) {
        router.push("/signin");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Complete Your Business Setup</h1>
          <p className="text-muted-foreground">
            You must complete these fields to proceed and access all business features
          </p>
        </div>

        <BusinessSetupForm />
      </div>
    </div>
  );
}