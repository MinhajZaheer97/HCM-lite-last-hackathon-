import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ⚠️ SERVER ONLY — service-role client bypasses RLS entirely.
// Must never be imported from a Client Component or used in any route a
// browser can trigger without an authorization check first.
// Legitimate uses: first-run setup, creating auth users for employee/HR
// logins, inserting system notifications.

function getAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("service-role client must never run in the browser");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment"
    );
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let cached;
export function getAdmin() {
  cached ??= getAdminClient();
  return cached;
}
