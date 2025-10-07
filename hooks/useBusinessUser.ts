
import { useEffect, useState } from "react";
import { getCurrentBusinessUser } from "@/lib/action";
import type { BusinessUser } from "@/lib/types/user";

export function useBusinessUser(user?: { role?: string }) {
  const [businessUser, setBusinessUser] = useState<BusinessUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "business") {
      setBusinessUser(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    async function fetchBusinessUser() {
      try {
        const result = await getCurrentBusinessUser();
        if (result.success && result.data) {
          setBusinessUser({
            ...result.data,
            website: result.data.website ?? "",
            logo_url: result.data.logo_url ?? "",
            phone_number: result.data.phone_number ?? "",
            created_at: result.data.created_at ?? "",
            updated_at: result.data.updated_at ?? "",
          });
        } else {
          setError(result.error || "Could not fetch business user");
        }
      } catch (err) {
        setError("Unexpected error fetching business user");
      } finally {
        setLoading(false);
      }
    }
    fetchBusinessUser();
  }, [user?.role]);

  return { businessUser, loading, error };
}
