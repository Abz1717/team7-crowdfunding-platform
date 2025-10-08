export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: "investor" | "business";
  account_balance: number;
  funding_balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessUser {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  website?: string | null;
  logo_url?: string | null;
  phone_number?: string | null;
  location: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface UpdateBusinessUserData {
  business_name?: string;
  description?: string;
  website?: string | null;
  logo_url?: string | null;
  phone_number?: string | null;
  location?: string;
}