"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";
import { getCompanyContext } from "@/lib/attendance/context";
import { listWorkingDates } from "@/lib/leave/rules";

export async function decideLeave({ requestId, decision, comment }) {
  const { profile } = await requireRole(["hr", "admin"]);
  if (!["approved", "rejected"].includes(decision)) return { error: "Invalid decision" };
  const supabase = await createClient();
  const { data: request } = await supabase.from("leave_requests").select("id, employee_id, leave_type_id, start_date, end_date, days, status, employees(full_name), leave_types(name)").eq("id", requestId).single();
  if (!request) return { error: "Leave request not found" };
  if (request.status !== "pending") return { error: "This request was already decided" };
  const cleanComment = String(comment ?? "").trim() || null;
  const { error } = await supabase.from("leave_requests").update({ status: decision, decided_by: profile.id, decision_comment: cleanComment, decided_at: new Date().toISOString() }).eq("id", requestId).eq("status", "pending");
  if (error) return { error: error.message };
  if (decision === "approved") {
    const { company, holidays } = await getCompanyContext();
    const dates = listWorkingDates(request.start_date, request.end_date, { weekendDays: company?.weekend_days ?? [0, 6], holidays });
    const records = dates.map((workDate) => ({
      employee_id: request.employee_id,
      company_id: profile.company_id,
      work_date: workDate,
      status: "on_leave",
      source: "system",
      notes: `Leave: ${request.leave_types?.name}`,
    }));
    if (records.length) {
      const { error: attendanceError } = await supabase.from("attendance_records").upsert(records, { onConflict: "employee_id,work_date", ignoreDuplicates: false });
      if (attendanceError) return { error: attendanceError.message };
    }
  }
  const { data: employeeProfile } = await supabase.from("profiles").select("id").eq("employee_id", request.employee_id).maybeSingle();
  if (employeeProfile) {
    await getAdmin().from("notifications").insert({
      profile_id: employeeProfile.id,
      company_id: profile.company_id,
      type: "leave_decision",
      title: `Leave request ${decision}`,
      body: `${request.leave_types?.name ?? "Leave"} request was ${decision}.${cleanComment ? ` ${cleanComment}` : ""}`,
      link: "/me/leave",
    });
  }
  revalidatePath("/hr/leave"); revalidatePath("/admin/leave"); revalidatePath("/me/leave"); revalidatePath("/me/attendance");
  return { ok: true };
}
