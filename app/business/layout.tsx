"use client";

import { BusinessProvider } from "@/context/BusinessContext";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessProvider>{children}</BusinessProvider>;
}
