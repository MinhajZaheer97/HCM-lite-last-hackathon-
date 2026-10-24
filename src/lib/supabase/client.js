import { createBrowserClient } from "@supabase/ssr";

// Browser client — anon key only. Every table is protected by RLS, so the
// anon key alone never grants access to data the signed-in user can't see.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
