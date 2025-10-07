import { Suspense } from "react";
import { AccountSettings } from "@/components/settings/account-settings";

export default function InvestorSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div />}>
        <AccountSettings />
      </Suspense>
    </div>
  );
}
