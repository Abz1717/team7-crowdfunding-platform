
import React from "react";

export function InvestorProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[InvestorProvider] Deprecated: Use SWR/data hooks from /hooks/useInvestorData.ts instead."
      );
    }
  }, []);
  return <>{children}</>;
}

export function useInvestor() {
  throw new Error(
    "[useInvestor] Deprecated: Use SWR/data hooks from /hooks/useInvestorData.ts instead."
  );
}

export function useInvestorSafe() {
  return null;
}
