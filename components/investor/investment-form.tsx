"use client";

import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  createInvestment,
  getAccountBalance,
  updateAccountBalance,
} from "@/lib/data";
import type { Pitch, InvestmentTier } from "@/lib/types";
import { InsufficientBalanceDialog } from "./insufficient-balance-dialog";
import { InvestmentValidationDialog } from "./investment-validation-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SuccessDialog } from "@/components/ui/success-dialog";

interface InvestmentFormProps {
  pitch: Pitch;
  onInvestmentComplete?: () => void;
  canInvest?: boolean;
}

export function InvestmentForm({
  pitch,
  onInvestmentComplete,
  canInvest = true,
}: InvestmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);

  // Calculate the maximum money that can be invested (not shares)
  const maxAvailableToInvest = Math.max(
    0,
    pitch.target_amount - pitch.current_amount
  );
  const [fundingMethod, setFundingMethod] = useState<"balance" | "bank">(
    "balance"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [accountBalance, setAccountBalance] = useState(0);
  const [insufficientBalanceDialogOpen, setInsufficientBalanceDialogOpen] =
    useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationDialogType, setValidationDialogType] = useState<
    "below_minimum" | "above_maximum"
  >("below_minimum");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchBalance() {
      if (user) {
        const balance = await getAccountBalance(user.id);
        setAccountBalance(balance);
      }
    }
    fetchBalance();
  }, [user]);

  const normalizedTiers = (pitch.investment_tiers as any[]).map((tier) => ({
    ...tier,
    min_amount:
      typeof tier.min_amount === "number"
        ? tier.min_amount
        : Number(tier.minAmount ?? 0),
    max_amount:
      typeof tier.max_amount === "number"
        ? tier.max_amount
        : Number(tier.maxAmount ?? 0),
    multiplier:
      typeof tier.multiplier === "number"
        ? tier.multiplier
        : Number(tier.multiplier ?? 1),
    name: tier.name,
  }));

  const getInvestmentTier = (amount: number): InvestmentTier | null => {
    for (const tier of normalizedTiers) {
      if (amount >= tier.min_amount && amount <= tier.max_amount) {
        return tier;
      }
    }
    return null;
  };

  const getMinimumInvestmentAmount = (): number => {
    if (normalizedTiers.length === 0) return 1;
    return Math.min(...normalizedTiers.map((tier) => tier.min_amount));
  };

  const getMaximumInvestmentAmount = (): number => {
    if (normalizedTiers.length === 0) return maxAvailableToInvest;
    return Math.min(
      Math.max(...normalizedTiers.map((tier) => tier.max_amount)),
      maxAvailableToInvest
    );
  };

  const getHighestTier = (): InvestmentTier | null => {
    if (normalizedTiers.length === 0) return null;
    return normalizedTiers.reduce((highest, current) =>
      current.max_amount > highest.max_amount ? current : highest
    );
  };

  const selectedTier = normalizedTiers.length > 0 ? getInvestmentTier(investmentAmount) : null;
  const projectedReturns = selectedTier
    ? investmentAmount * (pitch.profit_share / 100) * selectedTier.multiplier
    : investmentAmount * (pitch.profit_share / 100);

  // Replace handleInvestment with two-step confirmation
  const handleInvestment = () => {
    const minAmount = getMinimumInvestmentAmount();
    const maxAmount = getMaximumInvestmentAmount();
    if (investmentAmount < minAmount) {
      setValidationDialogType("below_minimum");
      setValidationDialogOpen(true);
      return;
    }
    if (investmentAmount > maxAmount) {
      setValidationDialogType("above_maximum");
      setValidationDialogOpen(true);
      return;
    }
    if (investmentAmount > maxAvailableToInvest) {
      toast({
        title: "Investment Too Large",
        description: `You cannot invest more than the remaining amount for this pitch ($${maxAvailableToInvest.toLocaleString()}).`,
        variant: "destructive",
      });
      return;
    }
    if (normalizedTiers.length > 0) {
      if (!selectedTier) {
        toast({
          title: "Invalid Investment Amount",
          description:
            "Please enter a valid investment amount within the available tiers",
          variant: "destructive",
        });
        return;
      }
    }
    // Check for insufficient balance
    if (fundingMethod === "balance" && investmentAmount > accountBalance) {
      setInsufficientBalanceDialogOpen(true);
      return;
    }
    setConfirmDialogOpen(true);
  };

  // Actual investment logic, called after confirmation
  const doInvestment = async () => {
    if (!user) return;
    if (normalizedTiers.length > 0 && !selectedTier) return;
    setIsProcessing(true);
    await new Promise((res) => setTimeout(res, 500)); // short delay for UX
    // Insert investment
    const investmentResult = await createInvestment({
      amount: investmentAmount,
      investment_amount: investmentAmount,
      investor_id: user.id,
      pitch_id: pitch.id,
      ...(normalizedTiers.length > 0 && selectedTier ? { tier: selectedTier } : {}),
      invested_at: new Date(),
    });
    if (fundingMethod === "balance") {
      await updateAccountBalance(user.id, accountBalance - investmentAmount);
      setAccountBalance(accountBalance - investmentAmount);
    }

    setIsProcessing(false);
    setSuccessDialogOpen(true);
  };

  const handleDepositSuccess = async () => {
    if (user) {
      const balance = await getAccountBalance(user.id);
      setAccountBalance(balance);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Make an Investment
        </CardTitle>

        <CardDescription>
          Invest in {pitch.title} and earn {pitch.profit_share}% profit share
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="amount">Investment Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={investmentAmount || ""}
            onChange={(e) => {
              let val = Number.parseInt(e.target.value) || 0;
              if (val > maxAvailableToInvest) {
                val = maxAvailableToInvest;
              }
              setInvestmentAmount(val);
            }}
            min={0}
            max={maxAvailableToInvest}
          />
          {maxAvailableToInvest === 0 && (
            <div className="text-xs text-red-600 mt-1">
              No more investment available for this pitch.
            </div>
          )}
          {investmentAmount > maxAvailableToInvest && (
            <div className="text-xs text-red-600 mt-1">
              You cannot invest more than the available amount ($
              {maxAvailableToInvest.toLocaleString()}).
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {normalizedTiers.map((tier) => (
              <Button
                key={tier.name}
                variant="outline"
                size="sm"
                onClick={() => setInvestmentAmount(tier.min_amount)}
                disabled={typeof tier.min_amount !== "number"}
              >
                $
                {typeof tier.min_amount === "number"
                  ? tier.min_amount.toLocaleString()
                  : "N/A"}{" "}
                ({tier.name})
              </Button>
            ))}
          </div>
        </div>

        {normalizedTiers.length > 0 && selectedTier && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default">{selectedTier.name} Tier</Badge>
                <span className="text-sm font-medium">
                  {selectedTier.multiplier}x Multiplier
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Investment Range</div>
                  <div className="font-medium">
                    ${selectedTier.min_amount.toLocaleString()} -
                    {selectedTier.max_amount === Number.POSITIVE_INFINITY
                      ? " ∞"
                      : ` $${selectedTier.max_amount.toLocaleString()}`}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Projected Annual Returns
                  </div>
                  <div className="font-medium text-green-600">
                    ${projectedReturns.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user && user.role === "investor" && (
          <div className="space-y-4">
            <Label>Funding Method</Label>
            <RadioGroup
              value={fundingMethod}
              onValueChange={(value) =>
                setFundingMethod(value as "balance" | "bank")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balance" id="balance" />
                <Label
                  htmlFor="balance"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Wallet className="h-4 w-4" />
                  Account Balance (${accountBalance.toLocaleString()} available)
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {investmentAmount > 0 && selectedTier && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Investment Summary</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Investment Amount:</span>
                  <span className="font-medium">
                    ${investmentAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Tier:</span>
                  <span className="font-medium">
                    {selectedTier.name} ({selectedTier.multiplier}x)
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Your Shares:</span>
                  <span className="font-medium">
                    {selectedTier && investmentAmount > 0
                      ? (
                          investmentAmount * selectedTier.multiplier
                        ).toLocaleString()
                      : "0"}
                  </span>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span>Projected Annual Returns:</span>
                  <span className="font-medium text-green-600">
                    ${projectedReturns.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {canInvest ? (
          <Button
            onClick={handleInvestment}
            disabled={
              investmentAmount === 0 ||
              isProcessing ||
              investmentAmount < getMinimumInvestmentAmount() ||
              investmentAmount > getMaximumInvestmentAmount() ||
              (normalizedTiers.length > 0 && !selectedTier) ||
              (fundingMethod === "balance" && investmentAmount > accountBalance)
            }
            className="w-full"
            size="lg"
          >
            {isProcessing
              ? "Processing Investment..."
              : `Invest $${investmentAmount.toLocaleString()}`}
          </Button>
        ) : null}
        {user && user.role === "investor" && (
          <p className="text-xs text-muted-foreground mt-2">
            By investing, you agree to the platform terms and the profit-sharing
            agreement for this pitch.
          </p>
        )}
      </CardContent>

      {/* Dialogs */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={doInvestment}
        title={`Confirm Investment`}
        description={`Are you sure you want to invest $${investmentAmount.toLocaleString()} in ${
          pitch.title
        }?`}
        confirmText="Yes, Invest"
        cancelText="No"
        isLoading={isProcessing}
      />
      <SuccessDialog
        open={successDialogOpen}
        onOpenChange={(open) => {
          setSuccessDialogOpen(open);
          // Only call onInvestmentComplete if provided and user closes dialog
          if (!open && typeof onInvestmentComplete === "function") {
            onInvestmentComplete();
          }
        }}
        title="Investment Confirmed!"
        description={`Your investment of $${investmentAmount.toLocaleString()} in ${
          pitch.title
        } was successful.`}
        confirmText="OK"
      />
      <InsufficientBalanceDialog
        open={insufficientBalanceDialogOpen}
        onOpenChange={setInsufficientBalanceDialogOpen}
        requiredAmount={investmentAmount}
        currentBalance={accountBalance}
        onDepositSuccess={handleDepositSuccess}
      />

      <InvestmentValidationDialog
        open={validationDialogOpen}
        onOpenChange={setValidationDialogOpen}
        type={validationDialogType}
        investmentAmount={investmentAmount}
        minAmount={getMinimumInvestmentAmount()}
        maxAmount={getMaximumInvestmentAmount()}
        tierName={getHighestTier()?.name}
      />
    </Card>
  );
}
