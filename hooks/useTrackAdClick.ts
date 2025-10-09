import { useEffect } from "react";
import { updateAdCampaignClicksAndBalance } from "@/lib/data";

export function useTrackAdClick(pitchId: string) {
  useEffect(() => {
    async function trackClick() {

        const businessUser = await getBusinessUserByPitchId(pitchId);
      if (!businessUser) return;
      const adCampaign = await getActiveAdCampaignByPitchId(pitchId);
      if (!adCampaign) return;

      await updateAdCampaignClicksAndBalance({
        adCampaignId: adCampaign.id,
        businessUserId: businessUser.id,
        userId: businessUser.user_id,
        clickCount: 1,
      });
    }
    trackClick();
  }, [pitchId]);
}

export async function getBusinessUserByPitchId(pitchId: string) {
    
  const supabase = (await import("@/utils/supabase/client")).createClient();
  const { data: pitch } = await supabase.from("pitch").select("business_id").eq("id", pitchId).single();

  if (!pitch) return null;
  const { data: businessUser } = await supabase.from("businessuser").select("id, user_id").eq("id", pitch.business_id).single();
  return businessUser;
}

export async function getActiveAdCampaignByPitchId(pitchId: string) {

  const supabase = (await import("@/utils/supabase/client")).createClient();
  const { data: campaign } = await supabase.from("ad_campaign").select("id").eq("pitch_id", pitchId).eq("status", "active").single();
  return campaign;
}
