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
    .select("id, full_name, role, employee_id, is_active")
    .eq("id", user.id)
    .single();

  return { user, profile: profile ?? null };
}

// Authoritative server-side role guard for layouts and pages.
export async function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || !profile.is_active) redirect("/login");
  if (!allowed.includes(profile.role)) redirect(roleHome[profile.role] ?? "/login");

  return { user, profile };
}

export async function isSetupComplete() {
  const { getAdmin } = await import("@/lib/supabase/admin");
  const { data } = await getAdmin().from("companies").select("id").limit(1);
  return Boolean(data?.length);
}
