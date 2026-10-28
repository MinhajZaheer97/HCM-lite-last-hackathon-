"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCompanyId, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveHoliday(row) {
  await requireRole("admin");
  const companyId = await getCurrentCompanyId();
  if (companyId === null) return { error: "Your account is not assigned to a company" };
  const name = String(row?.name ?? "").trim();
  const holidayDate = String(row?.holiday_date ?? "").trim();
  if (!name) return { error: "Holiday name is required" };
  if (!DATE_RE.test(holidayDate)) return { error: "A valid date is required" };

  const supabase = await createClient();
  const { error } = row.id
    ? await supabase.from("holidays").update({ name, holiday_date: holidayDate }).eq("id", row.id)
    : await supabase.from("holidays").insert({ name, holiday_date: holidayDate, company_id: companyId });

  if (error) return { error: error.message };
  revalidatePath("/admin/holidays");
  return { ok: true };
}

export async function deleteHoliday(id) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("holidays").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/holidays");
  return { ok: true };
}
