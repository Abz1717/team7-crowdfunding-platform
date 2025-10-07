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
import { AlertTriangle, Wallet } from "lucide-react";
import { DepositDialog } from "@/components/settings/deposit-dialog";
import { useState } from "react";

interface InsufficientBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredAmount: number;
  currentBalance: number;
  onDepositSuccess?: () => void;
}

export function InsufficientBalanceDialog({
  open,
  onOpenChange,
  requiredAmount,
  currentBalance,
  onDepositSuccess,
}: InsufficientBalanceDialogProps) {
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);

  const handleDepositSuccess = () => {
    setDepositDialogOpen(false);
    onOpenChange(false);
    if (onDepositSuccess) {
      onDepositSuccess();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <DialogTitle>Insufficient Balance</DialogTitle>
            </div>
            <DialogDescription>
              You don't have enough funds in your account to make this
              investment.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Required Amount:</span>
                <span className="font-medium">
                  £{requiredAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">
                  £{currentBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Shortfall:</span>
                <span className="font-medium text-red-600">
                  £{(requiredAmount - currentBalance).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>
                Add funds to your account to continue with this investment.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDepositDialogOpen(true)}>
              Deposit Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        onSuccess={handleDepositSuccess}
      />
    </>
  );
}
