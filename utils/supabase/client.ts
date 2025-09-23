import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // supabase client on browser
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
