import { getCurrentCompanyId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Loads company settings + holidays for the current user rather than a fixed
// singleton company row.
export async function getCompanyContext() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const [{ data: company }, { data: holidays }] = await Promise.all([
    companyId === null
      ? Promise.resolve({ data: null })
      : supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
    supabase.from("holidays").select("holiday_date"),
  ]);
  return {
    company,
    holidays: (holidays ?? []).map((h) => h.holiday_date),
  };
}
