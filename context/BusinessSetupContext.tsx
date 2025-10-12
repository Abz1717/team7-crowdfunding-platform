"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { getCurrentBusinessUser } from "@/lib/action";

interface BusinessSetupContextType {
  isSetupComplete: boolean;
  isLoading: boolean;
  checkBusinessSetup: () => Promise<void>;
  markSetupComplete: () => void; 
}

const BusinessSetupContext = createContext<BusinessSetupContextType | undefined>(undefined);

export function BusinessSetupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSetupComplete, setIsSetupComplete] = useState(true); 
  const [isLoading, setIsLoading] = useState(false);

  const checkBusinessSetup = useCallback(async () => {
    if (!user || user.role !== 'business') {
      setIsSetupComplete(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getCurrentBusinessUser();
      if (result.success && result.data) {
        const { business_name, description, location } = result.data;
        const isComplete = !!(business_name && description && location);
        setIsSetupComplete(isComplete);
      } else {
        setIsSetupComplete(false);
      }
    } catch (error) {
      setIsSetupComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markSetupComplete = useCallback(() => {
    setIsSetupComplete(true);
  }, []);

  useEffect(() => {
    if (user?.role === 'business') {
      checkBusinessSetup();
    } else {
      setIsSetupComplete(true);
      setIsLoading(false);
    }
  }, [user, checkBusinessSetup]);

  useEffect(() => {
    const handleFocus = () => {
      if (user?.role === 'business') {
        checkBusinessSetup();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.role, checkBusinessSetup]);

  const value: BusinessSetupContextType = {
    isSetupComplete,
    isLoading,
    checkBusinessSetup,
    markSetupComplete,
  };

  return (
    <BusinessSetupContext.Provider value={value}>
      {children}
    </BusinessSetupContext.Provider>
  );
}

export function useBusinessSetup() {
  const context = useContext(BusinessSetupContext);
  if (!context) {
    return {
      isSetupComplete: true,
      isLoading: false,
      checkBusinessSetup: async () => {},
      markSetupComplete: () => {},
    };
  }
  return context;
}