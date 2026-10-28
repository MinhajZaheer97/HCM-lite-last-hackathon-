"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCompanyId, requireRole } from "@/lib/auth";
import { getAdmin } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createHrAccount({ full_name, email, password }) {
  await requireRole("admin");
  const companyId = await getCurrentCompanyId();
  if (companyId === null) return { error: "Your account is not assigned to a company" };

  const name = String(full_name ?? "").trim();
  const mail = String(email ?? "").trim().toLowerCase();
  if (!name) return { error: "Full name is required" };
  if (!EMAIL_RE.test(mail)) return { error: "A valid email is required" };
  if (password && password.length < 8) return { error: "Password must be at least 8 characters" };

  const tempPassword = password || randomPassword();
  const db = getAdmin();

  const { data, error } = await db.auth.admin.createUser({
    email: mail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name, role: "hr", company_id: companyId },
  });
  if (error) return { error: error.message };

  // The auth trigger creates the profile; ensure name/role are set correctly.
  await db.from("profiles").upsert({
    id: data.user.id,
    full_name: name,
    role: "hr",
    company_id: companyId,
    is_active: true,
  });

  revalidatePath("/admin/hr-accounts");
  return { ok: true, tempPassword };
}

export async function setHrActive(profileId, isActive) {
  await requireRole("admin");
  const db = getAdmin();
  const { error } = await db
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId)
    .eq("role", "hr");
  if (error) return { error: error.message };
  revalidatePath("/admin/hr-accounts");
  return { ok: true };
}

export async function resetHrPassword(profileId) {
  await requireRole("admin");
  const tempPassword = randomPassword();
  const db = getAdmin();
  const { error } = await db.auth.admin.updateUserById(profileId, { password: tempPassword });
  if (error) return { error: error.message };
  return { ok: true, tempPassword };
}
