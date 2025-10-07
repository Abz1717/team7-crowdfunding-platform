"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfitDeclarationForm } from "@/components/business/profit-declaration-form";
import type { Pitch } from "@/lib/types/pitch";
import { useBusiness } from "@/context/BusinessContext";

interface DeclareProfitsDialogProps {
  pitch: Pitch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeclareProfitsDialog({
  pitch,
  open,
  onOpenChange,
}: DeclareProfitsDialogProps) {
  const { refreshAllData } = useBusiness();

  if (!pitch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Declare Profits for {pitch.title}</DialogTitle>
          <DialogDescription>
            Distribute returns to investors based on their investment tiers and
            profit share percentage
          </DialogDescription>
        </DialogHeader>
        <ProfitDeclarationForm
          pitch={pitch}
          onSuccess={async () => {
            // Refresh all business data after declaring profits
            await refreshAllData();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
