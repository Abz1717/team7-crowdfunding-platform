import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";

export function useBusinessAdCampaigns(businessId?: string) {

  const fetcher = async () => {
    if (!businessId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
        .from("ad_campaign")
        .select("*")
        .eq("business_id", businessId);

    if (error) throw error;
    return data || [];
    
  };
  const { data, error, isLoading } = useSWR(
    businessId ? ["ad-campaigns", businessId] : null,
    fetcher
  );
  return { campaigns: data, error, isLoading };
}
