import { BusinessSetupForm } from "@/components/business-setup-form";

export default function BusinessSetupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Tell us about your business</h1>
          <p className="text-muted-foreground">
            Help investors learn more about your company
          </p>
        </div>

        <BusinessSetupForm />
      </div>
    </div>
  );
}