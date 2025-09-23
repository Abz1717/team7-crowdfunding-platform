// mock data store






import type { Pitch, Investment, InvestmentTier, ProfitDistribution } from "./types"

// default investment tiers
export const defaultTiers: InvestmentTier[] = [
  { name: "Bronze", minAmount: 100, maxAmount: 999, multiplier: 1.0 },
  { name: "Silver", minAmount: 1000, maxAmount: 4999, multiplier: 1.2 },
  { name: "Gold", minAmount: 5000, maxAmount: 19999, multiplier: 1.5 },
  { name: "Platinum", minAmount: 20000, maxAmount: Number.POSITIVE_INFINITY, multiplier: 2.0 },
]

// mock pitches data
export const mockPitches: Pitch[] = [
  {
    id: "1",
    businessId: "1",
    productTitle: "EcoTech Smart Garden",
    elevatorPitch:
      "Revolutionary indoor gardening system that uses AI to optimize plant growth while reducing water usage by 70%",
    detailedPitch:
      "Our smart garden system combines IoT sensors, machine learning, and sustainable design to create the perfect growing environment for herbs and vegetables. Target customers include urban dwellers, restaurants, and eco-conscious consumers. We project 300% revenue growth over 3 years with expansion into commercial markets.",
    supportingMedia: ["/smart-garden-system.png"],
    targetAmount: 50000,
    investmentWindowEnd: new Date("2025-03-15"),
    profitSharePercentage: 15,
    investmentTiers: defaultTiers,
    currentAmount: 23500,
    status: "active",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "2",
    businessId: "1",
    productTitle: "Local Food Delivery App",
    elevatorPitch: "Connecting local restaurants with customers through sustainable delivery methods",
    detailedPitch:
      "A hyperlocal food delivery platform focusing on bicycle and electric vehicle delivery within 3-mile radius. Partnering with 50+ local restaurants to provide faster, cheaper, and more sustainable delivery options.",
    supportingMedia: [],
    targetAmount: 75000,
    investmentWindowEnd: new Date("2025-04-01"),
    profitSharePercentage: 12,
    investmentTiers: defaultTiers,
    currentAmount: 0,
    status: "draft",
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
  },
]

// mock investments data
export const mockInvestments: Investment[] = [
  {
    id: "1",
    investorId: "2",
    pitchId: "1",
    amount: 5000,
    tier: defaultTiers[2], // gold tier
    investedAt: new Date("2025-01-05"),
    returns: [],
  },
  {
    id: "2",
    investorId: "2",
    pitchId: "1",
    amount: 2500,
    tier: defaultTiers[1], // silver tier
    investedAt: new Date("2025-01-10"),
    returns: [],
  },
]

// Mock profit distributions
export const mockProfitDistributions: ProfitDistribution[] = [
  {
    id: "1",
    pitchId: "1",
    totalProfit: 15000,
    distributionDate: new Date("2024-12-31"),
    investorPayouts: [
      {
        investorId: "2",
        amount: 1687.5, // based on investment amount, tier multiplier, and profit share
        percentage: 11.25,
      },
    ],
  },
]

export function getPitchesByBusinessId(businessId: string): Pitch[] {
  return mockPitches.filter((pitch) => pitch.businessId === businessId)
}

export function getPitchById(id: string): Pitch | undefined {
  return mockPitches.find((pitch) => pitch.id === id)
}

export function getActivePitches(): Pitch[] {
  return mockPitches.filter((pitch) => pitch.status === "active")
}

export function getInvestmentsByInvestorId(investorId: string): Investment[] {
  return mockInvestments.filter((investment) => investment.investorId === investorId)
}

export function getInvestmentsByPitchId(pitchId: string): Investment[] {
  return mockInvestments.filter((investment) => investment.pitchId === pitchId)
}

export function getProfitDistributionsByPitchId(pitchId: string): ProfitDistribution[] {
  return mockProfitDistributions.filter((distribution) => distribution.pitchId === pitchId)
}

export function updatePitch(id: string, updates: Partial<Pitch>): boolean {
  const index = mockPitches.findIndex((pitch) => pitch.id === id)
  if (index !== -1) {
    mockPitches[index] = { ...mockPitches[index], ...updates, updatedAt: new Date() }
    return true
  }
  return false
}

export function createPitch(pitch: Omit<Pitch, "id" | "createdAt" | "updatedAt">): Pitch {
  const newPitch: Pitch = {
    ...pitch,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  mockPitches.push(newPitch)
  return newPitch
}

export function createInvestment(investment: Omit<Investment, "id" | "investedAt" | "returns">): Investment {
  const newInvestment: Investment = {
    ...investment,
    id: Date.now().toString(),
    investedAt: new Date(),
    returns: [],
  }
  mockInvestments.push(newInvestment)

  const pitch = getPitchById(investment.pitchId)
  if (pitch) {
    updatePitch(pitch.id, { currentAmount: pitch.currentAmount + investment.amount })
  }

  return newInvestment
}

export function calculateROI(investment: Investment): number {
  const totalReturns = investment.returns.reduce((sum, distribution) => {
    const payout = distribution.investorPayouts.find((p) => p.investorId === investment.investorId)
    return sum + (payout?.amount || 0)
  }, 0)

  return investment.amount > 0 ? (totalReturns / investment.amount) * 100 : 0
}

export const mockAccountBalances: Record<string, number> = {
  "2": 25000, 
}

export function getAccountBalance(userId: string): number {
  return mockAccountBalances[userId] || 0
}

export function updateAccountBalance(userId: string, amount: number): void {
  mockAccountBalances[userId] = (mockAccountBalances[userId] || 0) + amount
}
