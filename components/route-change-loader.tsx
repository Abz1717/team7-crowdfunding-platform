"use client";


import React from "react";
import LoadingScreen from "@/components/loading-screen";
import { useLoader } from "@/components/loader-context";


export function RouteChangeLoader({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLoader();
  return (
    <>
      {isLoading && <LoadingScreen />}
      {children}
    </>
  );
}
