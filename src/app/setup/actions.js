"use server";

import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const fail = (error) => ({ error });

function validateSetup({ company, admin }) {
  if (!company?.name?.trim()) return "Company name is required";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(admin?.email ?? "")) return "A valid admin email is required";
  if (!admin?.password || admin.password.length < 8) return "Admin password must be at least 8 characters";
  if (!admin?.full_name?.trim()) return "Admin full name is required";
  if (!company?.office_start || !company?.office_end) return "Office hours are required";
  if (company.office_start >= company.office_end) return "Office start must be before office end";
  const gm = Number(company.grace_minutes);
  if (!Number.isInteger(gm) || gm < 0 || gm > 120) return "Grace minutes must be 0–120";
  if (!Array.isArray(company.weekend_days)) return "Weekend days are required";
  return null;
}

export async function verifyAccessCode(code) {
  const expected = process.env.SETUP_ACCESS_CODE;
  if (!expected) return fail("SETUP_ACCESS_CODE is not configured on the server");
  if (!code || code !== expected) return fail("Invalid access code");

  const { getAdmin: getDb } = await import("@/lib/supabase/admin");
  const { data } = await getDb().from("companies").select("id").limit(1);
  if (data?.length) return fail("Setup is already completed for this company");
  return { ok: true };
}

export async function completeSetup({ accessCode, company, admin }) {
  const expected = process.env.SETUP_ACCESS_CODE;
  if (!expected || !accessCode || accessCode !== expected) return fail("Invalid access code");
  const validationError = validateSetup({ company, admin });
  if (validationError) return fail(validationError);

  const db = getAdmin();

  // Re-check emptiness under concurrency; also acts as the setup lock.
  const { data: existing } = await db.from("companies").select("id").limit(1);
  if (existing?.length) return fail("Setup is already completed for this company");

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: admin.email.trim(),
    password: admin.password,
    email_confirm: true,
    user_metadata: { full_name: admin.full_name.trim(), role: "admin" },
  });
  if (createError) return fail(createError.message);

  const { error: companyError } = await db.from("companies").insert({
    name: company.name.trim(),
    address: company.address?.trim() || null,
    office_location: company.office_location?.trim() || null,
    timezone: company.timezone || "Asia/Karachi",
    currency: company.currency || "PKR",
    office_start: company.office_start,
    office_end: company.office_end,
    grace_minutes: Number(company.grace_minutes),
    weekend_days: company.weekend_days,
    setup_completed_at: new Date().toISOString(),
  });

  if (companyError) {
    // Roll back the admin user so a retry starts clean.
    await db.auth.admin.deleteUser(created.user.id);
    return fail(companyError.message);
  }

  // Sign the new admin in (sets session cookies). Profile and audit rows are
  // created by the DB triggers from 003_triggers.sql.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: admin.email.trim(),
    password: admin.password,
  });
  if (signInError) redirect("/login");

  redirect("/admin/dashboard");
}
