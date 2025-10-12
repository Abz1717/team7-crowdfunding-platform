import { Suspense } from "react";
import { AccountSettings } from "@/components/settings/account-settings";
import LoadingScreen from "@/components/loading-screen";

export default function InvestorSettingsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="container mx-auto py-6">
        <AccountSettings />
      </div>
    </Suspense>
  );
}