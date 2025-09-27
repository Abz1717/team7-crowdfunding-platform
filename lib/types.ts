export interface InvestmentTier {
  name: string
  min_amount: number
  max_amount: number
  multiplier: number
}
{/*
export interface Pitch {
  id: string
  business_id: string
  product_title: string
  elevator_pitch: string
  detailed_pitch: string
  supporting_media: string[]
  target_amount: number
  investment_window_end: Date
  profit_share_percentage: number
  investment_tiers: InvestmentTier[]
  current_amount: number
  status: "draft" | "active" | "funded" | "cancelled" | "completed"
  created_at: Date
  updated_at: Date
  ai_analysis?: AIAnalysis
}

export interface AIAnalysis {
  rag_score: "red" | "amber" | "green"
  overall_score: number
  feedback: string[]
  suggestions: string[]
  analyzed_at: Date
}
*/}

// for now to match sujal table but needs changing.
export interface Pitch {
  id: string
  title: string
  elevator_pitch: string
  detailed_pitch: string
  target_amount: number
  current_amount: number
  profit_share: number
  end_date: string 
  status: string
  ai_rating?: string
  ai_feedback?: any 
  ai_analysis?: any 
  created_at: string 
  updated_at: string 
  business_id: string
  supporting_media: any 
  investment_tiers: any 
}

export interface Investment {
  investment_amount: number
  id: string
  investor_id: string
  pitch_id: string
  amount: number
  tier: InvestmentTier
  invested_at: Date
  returns: ProfitDistribution[]
}

export interface ProfitDistribution {
  id: string
  pitch_id: string
  total_profit: number
  distribution_date: Date
}
export interface InvestorPayout {
  id: string
  distribution_id: string
  investor_id: string
  amount: number
  percentage: number
}

export interface BusinessUser {
  id: string
  user_id: string
  business_name: string
  description: string
  website: string
  logo_url: string
  contact_email: string
  phone_number: string
  location: string
  created_at: string // or Date if you parse it
  updated_at: string // or Date if you parse it
}

export interface User {
  id: string
  email: string
  created_at: string // or Date if you parse it
  first_name: string
  last_name: string
  account_type: string
  account_balance: number
  total_invested: number
  total_returns: number
  overall_roi: number
}