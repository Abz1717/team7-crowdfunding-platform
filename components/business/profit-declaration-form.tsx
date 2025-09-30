"use client"


import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { previewProfitDistribution, declareProfits } from "@/lib/action"
import type { Pitch } from "@/lib/types/pitch"
import { DollarSign, TrendingUp, Users, Calculator, CheckCircle, AlertTriangle } from "lucide-react"



interface ProfitDeclarationFormProps {
  pitch: Pitch
  onSuccess?: () => void
}

export function ProfitDeclarationForm({ pitch, onSuccess }: ProfitDeclarationFormProps) {

  const [profitAmount, setProfitAmount] = useState<string>("")
  const [preview, setPreview] = useState<any>(null)

  const [isCalculating, setIsCalculating] = useState(false)
  const [isDeclaring, setIsDeclaring] = useState(false)

  const handlePreview = async () => {
    const amount = Number.parseFloat(profitAmount)
    if (!amount || amount <= 0) {
      toast.error("Invalid amount. Please enter a valid profit amount")
      return
    }

    setIsCalculating(true)
    try {
      const result = await previewProfitDistribution(pitch.id, amount)
      if (result.success) {
        setPreview(result.data)
      } else {
        toast.error(result.error || "Unable to calculate profit distribution preview")
      }

    } catch (error) {
      console.error("[v0] Error calculating preview:", error)
      toast.error("Unable to calculate profit distribution preview")
    } finally {
      setIsCalculating(false)
    }
  }

const handleDeclare = async () => {
    if (!preview) return

    setIsDeclaring(true)
    try {
      const profitToDeclare = preview.total_profit ?? Number.parseFloat(profitAmount)
      const result = await declareProfits(pitch.id, profitToDeclare)
      if (result.success) {
        toast.success(`Profits declared successfully! $${preview.total_to_investors?.toLocaleString?.() ?? profitToDeclare} distributed to ${preview.investor_count ?? "?"} investor${preview.investor_count !== 1 ? "s" : ""}`)
        if (onSuccess) onSuccess()
      } else {
        toast.error(result.error || "Unable to declare profits. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error declaring profits:", error)
      toast.error("Unable to declare profits. Please try again.")
    } finally {
      setIsDeclaring(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Declare Profits
            </CardTitle>
            <CardDescription>
              Enter the total profit amount to distribute to investors based on their investment tiers
            </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profitAmount">Total Profit Amount ($)</Label>
            <div className="flex gap-2">
              <Input
                id="profitAmount"
                type="number"
                placeholder="10000"
                value={profitAmount}
                onChange={(e) => setProfitAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <Button onClick={handlePreview} disabled={isCalculating || !profitAmount}>
                {isCalculating ? (
                  <>

                    <Calculator className="mr-2 h-4 w-4 animate-pulse" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate
                  </>
                )}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total to Investors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{preview?.total_to_investors?.toLocaleString?.()}</div>
              <p className="text-xs text-muted-foreground mt-1">{preview?.profit_share_percentage}% of total profit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Business Keeps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preview?.business_keeps?.toLocaleString?.()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(100 - (preview?.profit_share_percentage ?? 0)).toFixed(1)}% of total profit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Investors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preview?.investor_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total invested: {preview?.total_invested?.toLocaleString?.()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Investor Payouts
              </CardTitle>
              <CardDescription>Breakdown of returns for each investor based on their investment tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preview?.investor_payouts?.map?.((payout: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Investor {index + 1}</span>
                        <Badge variant="outline">{payout.tier_name}</Badge>
                        <span className="text-sm text-muted-foreground">{payout.tier_multiplier}x multiplier</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                         Investment: {payout.investment_amount?.toLocaleString?.()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{payout.amount?.toLocaleString?.()}</div>
                      <div className="text-xs text-muted-foreground">{payout.percentage?.toFixed?.(2)}% of total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>



          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
              <div>
                    <h4 className="font-semibold mb-1">Ready to declare profits?</h4>
                    <p className="text-sm text-muted-foreground">
                      This will distribute {preview?.total_to_investors?.toLocaleString?.()} to {preview?.investor_count} investor{preview?.investor_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button size="lg" onClick={handleDeclare} disabled={isDeclaring}>
                    {isDeclaring ? (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4 animate-pulse" />
                        Declaring...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Declare Profits
                      </>
                    )}
                  </Button>
            </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>






  )
}
