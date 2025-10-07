"use client";

import { InvestorProvider } from "@/context/InvestorContext";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InvestorProvider>{children}</InvestorProvider>;
}
