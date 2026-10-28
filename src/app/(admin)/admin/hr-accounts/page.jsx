import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId, requireRole } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import HrAccountsManager from "./manager";

export const metadata = { title: "HR Accounts — HCM Lite" };

export default async function HrAccountsPage() {
  await requireRole("admin");
  const companyId = await getCurrentCompanyId();
  if (companyId === null) return null;

  // Service-role read: profile emails live in auth.users, which only the
  // admin API exposes. Access is already admin-guarded by the layout.
  const { getAdmin } = await import("@/lib/supabase/admin");
  const { data: accounts } = await getAdmin()
    .from("profiles")
    .select("id, full_name, is_active")
    .eq("role", "hr")
    .eq("company_id", companyId)
    .order("full_name");

  // Fetch emails per profile via the admin auth API.
  const db = getAdmin();
  const enriched = await Promise.all(
    (accounts ?? []).map(async (a) => {
      const { data } = await db.auth.admin.getUserById(a.id);
      return { ...a, email: data?.user?.email ?? "—" };
    })
  );

  return (
    <>
      <PageHeader
        title="HR Accounts"
        description="Create HR logins, deactivate access, and reset passwords."
      />
      <HrAccountsManager accounts={enriched} />
    </>
  );
}
