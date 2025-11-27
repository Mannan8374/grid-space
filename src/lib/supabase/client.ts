// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 * Stateless — relies on cookies refreshed by middleware.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
