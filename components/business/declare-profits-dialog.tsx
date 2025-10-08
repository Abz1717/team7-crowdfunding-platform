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
import { mutate } from 'swr';

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
            // revalidate all relevant business data after declaring profits
            await Promise.all([
              mutate('my-pitches'),
              mutate('profit-distributions'),
              mutate('business-account-balance'),
              mutate('business-transactions'),
            ]);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
