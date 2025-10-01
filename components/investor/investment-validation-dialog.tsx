"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

interface InvestmentValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "below_minimum" | "above_maximum";
  investmentAmount: number;
  minAmount?: number;
  maxAmount?: number;
  tierName?: string;
}

export function InvestmentValidationDialog({
  open,
  onOpenChange,
  type,
  investmentAmount,
  minAmount,
  maxAmount,
  tierName,
}: InvestmentValidationDialogProps) {
  const isBelowMinimum = type === "below_minimum";
  const isAboveMaximum = type === "above_maximum";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isBelowMinimum ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <Info className="h-5 w-5 text-blue-500" />
            )}
            <DialogTitle>
              {isBelowMinimum ? "Investment Too Small" : "Investment Too Large"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isBelowMinimum
              ? `Your investment amount is below the minimum required for any tier.`
              : `Your investment amount exceeds the maximum allowed for the highest tier.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Amount:</span>
              <span className="font-medium">
                £{investmentAmount.toLocaleString()}
              </span>
            </div>

            {isBelowMinimum && minAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Minimum Required:</span>
                <span className="font-medium text-green-600">
                  £{minAmount.toLocaleString()}
                </span>
              </div>
            )}

            {isAboveMaximum && maxAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Maximum Allowed:</span>
                <span className="font-medium text-red-600">
                  £{maxAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isBelowMinimum ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Please increase your investment to at least £
                  {minAmount?.toLocaleString()} to invest in the Bronze tier.
                </span>
              </>
            ) : (
              <>
                <Info className="h-4 w-4" />
                <span>
                  You can invest a maximum of £{maxAmount?.toLocaleString()} in
                  the {tierName} tier.
                </span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {isBelowMinimum ? "Adjust Amount" : "Got it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
