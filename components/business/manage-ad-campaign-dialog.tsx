

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader as CardHeaderUI, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, MousePointerClick, Power, Plus } from "lucide-react";
import type { AdCampaign } from "@/lib/types";
import { updateAdCampaignClicksAndBalance } from "@/lib/data";
import { toast } from "sonner";

interface ManageAdCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: AdCampaign & { clicks: number; business_account_balance?: number };
  userId: string; // business user's user_id
  onExtendBudget: (amount: number) => void;
  onTurnOff: () => void;
}

export function ManageAdCampaignDialog({ open, onOpenChange, campaign, userId, onExtendBudget, onTurnOff }: ManageAdCampaignDialogProps) {
  const [extendAmount, setExtendAmount] = useState("");
  const [localClicks, setLocalClicks] = useState(typeof campaign.clicks === 'number' ? campaign.clicks : 0);
  const [localBudget, setLocalBudget] = useState(typeof campaign.budget === 'number' ? campaign.budget : 0);
  const [localAccountBalance, setLocalAccountBalance] = useState(
    typeof campaign.business_account_balance === 'number' ? campaign.business_account_balance : 0
  );
  const [loading, setLoading] = useState(false);

  const clickCost = 0.01;
  const totalClickCost = localClicks * clickCost;
  const remainingBudget = Math.max(0, Number(localBudget) - totalClickCost);
  const remainingAccountBalance = Math.max(0, Number(localAccountBalance) - totalClickCost);

  const handleSimulateClick = async () => {
    setLoading(true);
    try {
      const res = await updateAdCampaignClicksAndBalance({
        adCampaignId: campaign.id,
        businessUserId: campaign.business_id,
        userId,
        clickCount: 1,
      });
      if (res.success) {
        setLocalClicks(res.newClicks ?? localClicks + 1);
        setLocalBudget(res.newBudget ?? localBudget - clickCost);
        setLocalAccountBalance(
          typeof res.newAccountBalance === 'number'
            ? res.newAccountBalance
            : (typeof localAccountBalance === 'number' ? localAccountBalance - clickCost : 0)
        );
        toast.success("Click registered and balances updated.");
      } else {
        toast.error(res.error || "Failed to register click.");
      }
    } catch (err) {
      toast.error("Unexpected error registering click.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg rounded-lg">

        <DialogHeader>

          <DialogTitle>Manage Ad Campaign</DialogTitle>

          <DialogDescription>
            View and manage your ad campaign for this pitch.
          </DialogDescription>
          
        </DialogHeader>

        <Card className="mb-4">

          <CardHeaderUI>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">Clicks:</span>
              <span className="font-bold text-lg">{localClicks}</span>
            </CardTitle>
          </CardHeaderUI>

          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <span>Remaining Budget: </span>
                <span className="font-bold">£{remainingBudget.toFixed(2)}</span>
              </div>

              <Progress value={Math.max(0, (remainingBudget / localBudget) * 100)} className="h-2 bg-yellow-100" />
              <div className="text-xs text-gray-500 mt-2">
                Each click costs £0.01, deducted from both the campaign budget and your business account balance.
              </div>

            </CardContent>
          </Card>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Extend Budget (£)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={extendAmount}
                onChange={e => setExtendAmount(e.target.value)}
                className="border rounded px-2 py-1 w-24"
              />
              <Button
                variant="yellow"
                onClick={() => {
                  const amt = Number(extendAmount);
                  if (amt > 0) onExtendBudget(amt);
                  setExtendAmount("");
                }}
                  disabled={!extendAmount || Number(extendAmount) <= 0}
                >
                  <Plus className="h-4 w-4 mr-1" /> Extend
                </Button>
              </div>
            </div>
            <Button variant="destructive" onClick={onTurnOff} className="flex items-center gap-2">
              <Power className="h-4 w-4" /> Turn Off Ad
            </Button>
          </div>






      </DialogContent>
    </Dialog>
  );
}
