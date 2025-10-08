import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useInvestorAdverts() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchAdverts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: adverts, error: advertsError } = await supabase
          .from("ad_campaign")
          .select(`
            id,
            pitch_id,
            ad_title,
            ad_description,
            target_audience,
            budget,
            ad_image_url,
            status,
            created_at,
            pitch: pitch_id (
              id,
              title,
              elevator_pitch,
              current_amount,
              target_amount,
              supporting_media
            )
          `)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (advertsError) throw advertsError;

        const mapped = (adverts || []).map((ad: any) => ({
          id: ad.pitch?.id || ad.pitch_id,
          title: ad.pitch?.title || ad.ad_title,
          elevator_pitch: ad.pitch?.elevator_pitch || ad.ad_description,
          current_amount: ad.pitch?.current_amount,
          target_amount: ad.pitch?.target_amount,
          isPromoted: true,
          supporting_media: ad.pitch?.supporting_media || [],
          imageUrl: ad.ad_image_url || (ad.pitch?.supporting_media?.[0] ?? ""),


        
        }));
        setData(mapped);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdverts();
  }, []);

  return {
    data,
    isLoading,
    error,
  };
}
