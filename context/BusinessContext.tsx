"use client";

import React, { createContext, useContext, ReactNode } from "react";

// minimal BusinessContext for global UI state
const BusinessContext = createContext<null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  return (
    <BusinessContext.Provider value={null}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
