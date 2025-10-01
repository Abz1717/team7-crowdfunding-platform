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
import { CreditCard } from "lucide-react";
import { depositFunds } from "@/lib/action";
import { useToast } from "@/hooks/use-toast";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DepositDialog({
  open,
  onOpenChange,
  onSuccess,
}: DepositDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
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

      if (formData.cardNumber.length < 13) {
        toast({
          title: "Invalid Card",
          description: "Please enter a valid card number",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await depositFunds(amount, {
        cardNumber: formData.cardNumber,
        cardExpiry: formData.cardExpiry,
        cardCvv: formData.cardCvv,
        cardName: formData.cardName,
      });

      if (result.success) {
        toast({
          title: "Deposit Successful",
          description: `£${amount.toFixed(2)} added to your account`,
        });
        setFormData({
          amount: "",
          cardNumber: "",
          cardExpiry: "",
          cardCvv: "",
          cardName: "",
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Deposit Failed",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error depositing funds:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (/^\d*$/.test(value) && value.length <= 16) {
      setFormData({ ...formData, cardNumber: value });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    if (value.length <= 5) {
      setFormData({ ...formData, cardExpiry: value });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setFormData({ ...formData, cardCvv: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>Add funds to your account</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount (£)</Label>
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
                className="mt-1.5"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm font-medium pt-2">
                <CreditCard className="h-4 w-4" />
                Card Details
              </div>

              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Smith"
                  value={formData.cardName}
                  onChange={(e) =>
                    setFormData({ ...formData, cardName: e.target.value })
                  }
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formatCardNumber(formData.cardNumber)}
                  onChange={handleCardNumberChange}
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cardExpiry">Expiry</Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={formData.cardExpiry}
                    onChange={handleExpiryChange}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="cardCvv">CVV</Label>
                  <Input
                    id="cardCvv"
                    placeholder="123"
                    value={formData.cardCvv}
                    onChange={handleCvvChange}
                    required
                    type="password"
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
              {loading ? "Processing..." : "Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
