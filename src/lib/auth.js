import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const roleHome = { admin: "/admin/dashboard", hr: "/hr/dashboard", employee: "/me/dashboard" };

export async function getSessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, employee_id, is_active, company_id")
    .eq("id", user.id)
    .single();

  return { user, profile: profile ?? null };
}

export async function getCurrentCompanyId() {
  const { profile } = await getCurrentProfile();
  return profile?.company_id ?? null;
}

// Authoritative server-side role guard for layouts and pages.
export function getCompanyDashboardPath(profile) {
  if (!profile?.role) return "/login";
  return roleHome[profile.role] ?? "/login";
}

export async function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || !profile.is_active) redirect("/login");
  if (!profile.company_id) redirect("/setup");
  if (!allowed.includes(profile.role)) redirect(getCompanyDashboardPath(profile));

  return { user, profile };
}

export async function isSetupComplete() {
  const { getAdmin } = await import("@/lib/supabase/admin");
  const { data } = await getAdmin().from("companies").select("id").limit(1);
  return Boolean(data?.length);
}
