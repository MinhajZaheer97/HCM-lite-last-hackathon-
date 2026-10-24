"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/attendance/context";
import { requestedLeaveDays } from "@/lib/leave/rules";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function applyLeave({ leaveTypeId, startDate, endDate, isHalfDay, reason }) {
  const { profile } = await requireRole("employee");
  if (!profile?.employee_id) return { error: "Your account is not linked to an employee record" };
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate) || endDate < startDate) {
    return { error: "Enter a valid date range" };
  }
  const text = String(reason ?? "").trim();
  if (!text) return { error: "A reason is required" };

  const supabase = await createClient();
  const { company, holidays } = await getCompanyContext();
  const days = requestedLeaveDays(startDate, endDate, {
    weekendDays: company?.weekend_days ?? [0, 6],
    holidays,
  }, Boolean(isHalfDay));
  if (!days) return { error: isHalfDay ? "Half-day leave must be one working day" : "The selected range has no working days" };

  const { data: type } = await supabase.from("leave_types").select("id, name, annual_days").eq("id", leaveTypeId).single();
  if (!type) return { error: "Leave type not found" };
  const yearStart = `${startDate.slice(0, 4)}-01-01`;
  const yearEnd = `${startDate.slice(0, 4)}-12-31`;
  const { data: existing } = await supabase
    .from("leave_requests")
    .select("days")
    .eq("employee_id", profile.employee_id)
    .in("status", ["pending", "approved"])
    .gte("start_date", yearStart)
    .lte("start_date", yearEnd)
    .eq("leave_type_id", type.id);
  const used = (existing ?? []).reduce((sum, item) => sum + Number(item.days), 0);
  if (used + days > Number(type.annual_days)) {
    return { error: `Insufficient ${type.name} balance. Remaining: ${Math.max(0, Number(type.annual_days) - used)} day(s).` };
  }

  const { error } = await supabase.from("leave_requests").insert({
    employee_id: profile.employee_id,
    leave_type_id: type.id,
    start_date: startDate,
    end_date: endDate,
    days,
    is_half_day: Boolean(isHalfDay),
    reason: text,
  });
  if (error) return { error: error.code === "23P01" ? "This leave overlaps another pending or approved request" : error.message };
  revalidatePath("/me/leave");
  revalidatePath("/hr/leave");
  return { ok: true };
}

export async function cancelLeave(requestId) {
  const { profile } = await requireRole("employee");
  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").update({ status: "cancelled" })
    .eq("id", requestId).eq("employee_id", profile.employee_id).eq("status", "pending");
  if (error) return { error: error.message };
  revalidatePath("/me/leave");
  revalidatePath("/hr/leave");
  return { ok: true };
}
