import { Suspense } from "react";
import { AccountSettings } from "@/components/settings/account-settings";

export default function InvestorSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto py-6">
        <AccountSettings />
      </div>
    </Suspense>
  );
}