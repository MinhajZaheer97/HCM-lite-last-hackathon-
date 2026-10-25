"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";
import { parseCsv, validateRows, CSV_COLUMNS } from "@/lib/csv";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const STATUSES = ["probation", "active", "exited"];
const GENDERS = ["male", "female", "other"];

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function nextEmpCode(supabase) {
  const { data } = await supabase
    .from("employees")
    .select("emp_code")
    .order("emp_code", { ascending: false })
    .limit(1);
  const last = data?.[0]?.emp_code;
  const num = last ? parseInt(last.replace(/\D/g, ""), 10) || 0 : 0;
  return `EMP-${String(num + 1).padStart(4, "0")}`;
}

export async function saveEmployee(row) {
  await requireRole(["hr", "admin"]);
  const name = String(row?.full_name ?? "").trim();
  const email = String(row?.email ?? "").trim().toLowerCase();
  if (!name) return { error: "Full name is required" };
  if (!EMAIL_RE.test(email)) return { error: "A valid email is required" };
  if (!DATE_RE.test(String(row?.join_date ?? ""))) return { error: "Join date is required (YYYY-MM-DD)" };
  if (!STATUSES.includes(row?.status)) return { error: "Invalid employment status" };
  if (row?.dob && !DATE_RE.test(String(row.dob))) return { error: "DOB must be YYYY-MM-DD or empty" };
  if (row?.gender && !GENDERS.includes(row.gender)) return { error: "Invalid gender" };
  if (row?.exit_date && !DATE_RE.test(String(row.exit_date)))
    return { error: "Exit date must be YYYY-MM-DD or empty" };
  if (row?.exit_date && row?.join_date && row.exit_date < row.join_date)
    return { error: "Exit date cannot be before join date" };

  const supabase = await createClient();

  let empCode = String(row?.emp_code ?? "").trim().toUpperCase();
  if (!empCode) empCode = await nextEmpCode(supabase);

  const payload = {
    emp_code: empCode,
    full_name: name,
    email,
    phone: String(row?.phone ?? "").trim() || null,
    gender: row?.gender || null,
    dob: row?.dob || null,
    address: String(row?.address ?? "").trim() || null,
    department_id: row?.department_id ? Number(row.department_id) : null,
    designation_id: row?.designation_id ? Number(row.designation_id) : null,
    join_date: row.join_date,
    exit_date: row?.exit_date || null,
    status: row.status,
  };

  const { error } = row.id
    ? await supabase.from("employees").update(payload).eq("id", row.id)
    : await supabase.from("employees").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/hr/employees");
  revalidatePath("/admin/employees");
  return { ok: true };
}

export async function createEmployeeLogin(employeeId) {
  await requireRole(["hr", "admin"]);

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, email, auth_user_id")
    .eq("id", employeeId)
    .single();

  if (!employee) return { error: "Employee not found" };
  if (employee.auth_user_id) return { error: "This employee already has a login" };

  const tempPassword = randomPassword();
  const db = getAdmin();

  const { data, error } = await db.auth.admin.createUser({
    email: employee.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: employee.full_name, role: "employee" },
  });
  if (error) return { error: error.message };

  // Link the auth user to the employee record and its profile row
  // (created automatically by the on_auth_user_created trigger).
  const { error: linkError } = await db
    .from("employees")
    .update({ auth_user_id: data.user.id })
    .eq("id", employee.id);
  const { error: profileError } = await db
    .from("profiles")
    .update({ employee_id: employee.id })
    .eq("id", data.user.id);

  if (linkError || profileError) {
    // Roll back so a retry starts clean.
    await db.auth.admin.deleteUser(data.user.id);
    return { error: linkError?.message ?? profileError?.message };
  }

  revalidatePath("/hr/employees");
  return { ok: true, tempPassword };
}

export async function resetEmployeePassword(employeeId) {
  await requireRole(["hr", "admin"]);

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("id, auth_user_id")
    .eq("id", employeeId)
    .single();

  if (!employee) return { error: "Employee not found" };
  if (!employee.auth_user_id) return { error: "This employee does not have a login yet" };

  const tempPassword = randomPassword();
  const { error } = await getAdmin().auth.admin.updateUserById(employee.auth_user_id, {
    password: tempPassword,
  });

  if (error) return { error: error.message };

  return { ok: true, tempPassword };
}

// ── CSV import: dry-run first, commit only valid rows after confirm ──
export async function importCsvDryRun(csvText) {
  await requireRole(["hr", "admin"]);

  const supabase = await createClient();
  const [{ data: existing }, { data: departments }, { data: designations }] = await Promise.all([
    supabase.from("employees").select("emp_code, email"),
    supabase.from("departments").select("id, name"),
    supabase.from("designations").select("id, name"),
  ]);

  const parsed = parseCsv(csvText);
  const result = validateRows(parsed, {
    existing: existing ?? [],
    departments: departments ?? [],
    designations: designations ?? [],
  });
  return { ...result, columns: CSV_COLUMNS };
}

export async function importCsvCommit(validRows) {
  await requireRole(["hr", "admin"]);
  if (!Array.isArray(validRows) || !validRows.length) return { error: "Nothing to import" };
  // Hard cap: keep a single action from writing an unreasonable batch.
  if (validRows.length > 500) return { error: "Import is limited to 500 rows per batch" };

  const supabase = await createClient();
  const [{ data: departments }, { data: designations }] = await Promise.all([
    supabase.from("departments").select("id, name"),
    supabase.from("designations").select("id, name"),
  ]);

  // Re-resolve names → ids server-side; the client never dictates ids.
  const rows = validRows.map((r) => ({
    emp_code: String(r.emp_code ?? "").trim().toUpperCase(),
    full_name: String(r.full_name ?? "").trim(),
    email: String(r.email ?? "").trim().toLowerCase(),
    phone: String(r.phone ?? "").trim() || null,
    gender: r.gender || null,
    dob: r.dob || null,
    address: String(r.address ?? "").trim() || null,
    department_id: departments?.find((d) => d.name === r.department)?.id ?? null,
    designation_id: designations?.find((d) => d.name === r.designation)?.id ?? null,
    join_date: r.join_date,
    status: r.status || "probation",
  }));

  // Chunked insert; a conflicting row aborts the whole batch (all-or-nothing).
  const { error } = await supabase.from("employees").insert(rows);
  if (error) {
    return {
      error: error.code === "23505"
        ? `A duplicate emp_code or email was found while writing — nothing was imported. (${error.message})`
        : error.message,
    };
  }

  revalidatePath("/hr/employees");
  revalidatePath("/admin/employees");
  return { ok: true, imported: rows.length };
}
