import { Navbar } from "@/components/layout/navbar";
import { PitchProvider } from "@/context/PitchContext";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PitchProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </PitchProvider>
  );
}
