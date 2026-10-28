"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCompanyId, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveLeaveType(row) {
  await requireRole("admin");
  const companyId = await getCurrentCompanyId();
  if (companyId === null) return { error: "Your account is not assigned to a company" };

  const name = String(row?.name ?? "").trim();
  if (!name) return { error: "Leave type name is required" };

  const annual = Number(row.annual_days);
  if (!Number.isFinite(annual) || annual <= 0 || annual > 365)
    return { error: "Annual days must be between 0.5 and 365" };

  const payload = { name, annual_days: annual, is_paid: Boolean(row.is_paid), company_id: companyId };
  const supabase = await createClient();
  const { error } = row.id
    ? await supabase.from("leave_types").update(payload).eq("id", row.id)
    : await supabase.from("leave_types").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/leave-types");
  return { ok: true };
}

export async function deleteLeaveType(id) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("leave_types").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503"
        ? "This leave type is used by existing leave requests and cannot be deleted."
        : error.message,
    };
  }
  revalidatePath("/admin/leave-types");
  return { ok: true };
}
