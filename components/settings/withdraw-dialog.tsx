"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark } from "lucide-react";
import { withdrawFunds } from "@/lib/action";
import { useToast } from "@/hooks/use-toast";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentBalance: number;
  fundingOnly?: boolean;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  onSuccess,
  currentBalance,
  fundingOnly,
}: WithdrawDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    accountName: "",
    accountNumber: "",
    sortCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);

      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount greater than £0",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (amount > currentBalance) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough funds to withdraw this amount",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (formData.sortCode.replace(/-/g, "").length !== 6) {
        toast({
          title: "Invalid Sort Code",
          description: "Sort code must be 6 digits",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (formData.accountNumber.length !== 8) {
        toast({
          title: "Invalid Account Number",
          description: "Account number must be 8 digits",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await withdrawFunds(amount, {
        accountNumber: formData.accountNumber,
        sortCode: formData.sortCode.replace(/-/g, ""),
        accountName: formData.accountName,
      });

      if (result.success) {
        toast({
          title: "Withdrawal Successful",
          description: `£${amount.toFixed(2)} withdrawn from your account`,
        });
        setFormData({
          amount: "",
          accountName: "",
          accountNumber: "",
          sortCode: "",
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Withdrawal Failed",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 8) {
      setFormData({ ...formData, accountNumber: value });
    }
  };

  const handleSortCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "-" + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + "-" + value.slice(5, 7);
    }
    if (value.length <= 8) {
      setFormData({ ...formData, sortCode: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[480px] rounded-xl">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw funds to your UK bank account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount (£)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      amount: currentBalance.toString(),
                    })
                  }
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Available: £{currentBalance.toFixed(2)}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm font-medium pt-2">
                <Landmark className="h-4 w-4" />
                Bank Account Details
              </div>

              <div>
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  placeholder="John Smith"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sortCode">Sort Code</Label>
                  <Input
                    id="sortCode"
                    placeholder="12-34-56"
                    value={formData.sortCode}
                    onChange={handleSortCodeChange}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="12345678"
                    value={formData.accountNumber}
                    onChange={handleAccountNumberChange}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
