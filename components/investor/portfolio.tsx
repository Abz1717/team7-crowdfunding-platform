"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import {getInvestmentsByInvestorId, getPitchById, calculateROI, getAccountBalance, updateAccountBalance,} from "@/lib/data"
import type { Investment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { DollarSign, TrendingUp, Calendar, Wallet, ArrowUpRight, ArrowDownLeft, PieChart, Target } from "lucide-react"

export function Portfolio() {
  // current user and toast noti's, users invesments, account balance and widthdrawal status
  const { user } = useAuth()
  const { toast } = useToast()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [accountBalance, setAccountBalance] = useState(0)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  useEffect(() => {
    if (user) {
      const userInvestments = getInvestmentsByInvestorId(user.id)
      setInvestments(userInvestments)
      setAccountBalance(getAccountBalance(user.id))
    }
  }, [user])

  // calculating total invested amount
  const totalInvested = investments.reduce((sum, investment) => sum + investment.amount, 0)

  // calcualting total returns from all investments
  const totalReturns = investments.reduce((sum, investment) => {
    const returns = investment.returns.reduce((returnSum, distribution) => {
      const payout = distribution.investorPayouts.find((p) => p.investorId === user?.id)
      return returnSum + (payout?.amount || 0)
    }, 0)
    return sum + returns
  }, 0)

  //calculating overall roi 
  const overallROI = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

  //wthdrawal logic
  const handleWithdraw = async (amount: number) => {
    if (!user || amount > accountBalance) return

    setIsWithdrawing(true)

    // mock withdrawal 
    setTimeout(() => {
      updateAccountBalance(user.id, -amount)
      setAccountBalance((prev) => prev - amount)

      toast({
        title: "Withdrawal successful",
        description: `$${amount.toLocaleString()} has been transferred to your bank account`,
      })

      setIsWithdrawing(false)
    }, 1500)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const getInvestmentWithPitch = (investment: Investment) => {
    const pitch = getPitchById(investment.pitchId)
    return { investment, pitch }
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accountBalance.toLocaleString()}</div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleWithdraw(1000)}
                disabled={isWithdrawing || accountBalance < 1000}
              >
                {isWithdrawing ? "Processing..." : "Withdraw $1K"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvested.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {investments.length} investment{investments.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalReturns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From profit distributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall ROI</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={overallROI >= 0 ? "text-green-600" : "text-red-600"}>
                {overallROI >= 0 ? "+" : ""}
                {overallROI.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My Investments
          </CardTitle>
          <CardDescription>Track your investments and their performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
              <p className="text-muted-foreground mb-4">
                Start investing in promising businesses to build your portfolio
              </p>
              <Link href="/investor">
                <Button>Browse Opportunities</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => {
                const { pitch } = getInvestmentWithPitch(investment)
                const roi = calculateROI(investment)
                const investmentReturns = investment.returns.reduce((sum, distribution) => {
                  const payout = distribution.investorPayouts.find((p) => p.investorId === user?.id)
                  return sum + (payout?.amount || 0)
                }, 0)

                if (!pitch) return null

                return (
                  <Card key={investment.id} className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{pitch.productTitle}</h4>
                          <p className="text-sm text-muted-foreground">{pitch.elevatorPitch}</p>
                        </div>
                        <Badge variant="outline">{investment.tier.name} Tier</Badge>
                      </div>

                      <div className="grid md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Investment Amount</div>
                          <div className="font-semibold">${investment.amount.toLocaleString()}</div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Tier & Multiplier</div>
                          <div className="font-semibold">
                            {investment.tier.name} ({investment.tier.multiplier}x)
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Investment Date</div>
                          <div className="font-semibold">{formatDate(investment.investedAt)}</div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Returns Received</div>
                          <div className="font-semibold text-green-600">${investmentReturns.toLocaleString()}</div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Current ROI</div>
                          <div className={`font-semibold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {roi >= 0 ? "+" : ""}
                            {roi.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Pitch Status:{" "}
                            <Badge variant="default" className="ml-1">
                              {pitch.status}
                            </Badge>
                          </div>
                          <Link href={`/investor/pitch/${pitch.id}`}>
                            <Button variant="outline" size="sm">
                              View Pitch Details
                              <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {investments.slice(0, 3).map((investment) => {
              const pitch = getPitchById(investment.pitchId)
              return (
                <div key={investment.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Invested in {pitch?.productTitle}</div>
                    <div className="text-sm text-muted-foreground">
                      ${investment.amount.toLocaleString()} • {formatDate(investment.investedAt)}
                    </div>
                  </div>
                  <Badge variant="outline">{investment.tier.name}</Badge>
                </div>
              )
            })}

            {investments.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
