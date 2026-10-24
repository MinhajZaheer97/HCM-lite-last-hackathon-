import { createClient } from "@/lib/supabase/server";

// Loads company settings + holidays; the single source every attendance
// calculation reads from.
export async function getCompanyContext() {
  const supabase = await createClient();
  const [{ data: company }, { data: holidays }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", 1).single(),
    supabase.from("holidays").select("holiday_date"),
  ]);
  return {
    company,
    holidays: (holidays ?? []).map((h) => h.holiday_date),
  };
}
