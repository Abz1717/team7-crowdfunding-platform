export interface InvestmentTier {
  name: string
  minAmount: number
  maxAmount: number
  multiplier: number
}

export interface Pitch {
  id: string
  businessId: string
  productTitle: string
  elevatorPitch: string
  detailedPitch: string
  supportingMedia: string[]
  targetAmount: number
  investmentWindowEnd: Date
  profitSharePercentage: number
  investmentTiers: InvestmentTier[]
  currentAmount: number
  status: "draft" | "active" | "funded" | "cancelled" | "completed"
  createdAt: Date
  updatedAt: Date
  aiAnalysis?: AIAnalysis
}

export interface AIAnalysis {
  ragScore: "red" | "amber" | "green"
  overallScore: number
  feedback: string[]
  suggestions: string[]
  analyzedAt: Date
}

export interface Investment {
  id: string
  investorId: string
  pitchId: string
  amount: number
  tier: InvestmentTier
  investedAt: Date
  returns: ProfitDistribution[]
}

export interface ProfitDistribution {
  id: string
  pitchId: string
  totalProfit: number
  distributionDate: Date
  investorPayouts: {
    investorId: string
    amount: number
    percentage: number
  }[]
}
