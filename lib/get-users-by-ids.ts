import { createClient } from "@/utils/supabase/client";
export type UserName = Pick<import("@/lib/types").User, "id" | "first_name" | "last_name">;

export async function getUsersByIds(ids: string[]): Promise<UserName[]> {
  if (!ids.length) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user")
    .select("id, first_name, last_name")
    .in("id", ids);
  return data ?? [];
}
