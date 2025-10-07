export interface InvestmentTier {
  name: string;
  minAmount: string;
  maxAmount: string;
  multiplier: string;
}

export interface PitchFormData {
  title: string;
  elevatorPitch: string;
  detailedPitch: string;
  targetAmount: string;
  profitShare: string;
  profitDistributionFrequency: string;
  tags: string[];
  endDate: Date | undefined;
  tiers: InvestmentTier[];
}

export interface AIAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  marketPotential: string;
  riskLevel: string;
  recommendations: string[];
}

export interface Pitch {
  id: string;
  title: string;
  elevator_pitch: string;
  detailed_pitch: string;
  target_amount: number;
  current_amount: number;
  profit_share: number;
  profit_distribution_frequency: string;
  tags: string[];
  end_date: string;
  status: "draft" | "active" | "funded" | "closed";
  ai_rating: string | null;
  ai_feedback: unknown;
  ai_analysis: AIAnalysis | null;
  created_at: string;
  updated_at: string;
  business_id: string | null;
  supporting_media: string[];
  investment_tiers: InvestmentTier[];
}

export interface CreatePitchData {
  title: string;
  elevator_pitch: string;
  detailed_pitch: string;
  target_amount: number;
  profit_share: number;
  profit_distribution_frequency: string;
  tags: string[];
  end_date: string;
  investment_tiers: InvestmentTier[];
  ai_analysis?: AIAnalysis;
  supporting_media?: string[];
}

export interface UpdatePitchData {
  title?: string;
  elevator_pitch?: string;
  detailed_pitch?: string;
  target_amount?: number;
  profit_share?: number;
  profit_distribution_frequency?: string;
  tags?: string[];
  end_date?: string;
  investment_tiers?: InvestmentTier[];
  ai_analysis?: AIAnalysis;
  supporting_media?: string[];
  status?: "draft" | "active" | "funded" | "closed";
}
