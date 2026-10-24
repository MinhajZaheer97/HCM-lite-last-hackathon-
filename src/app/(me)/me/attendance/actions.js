"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/attendance/context";
import { zonedParts } from "@/lib/dates/tz";
import { dayType, statusForCheckIn, statusForCheckOut, scheduledMinutes, workedMinutes } from "@/lib/attendance/rules";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// One action handles both directions: no record → check in; open record →
// check out; completed record → rejected. Duplicate prevention is backed
// by the unique(employee_id, work_date) constraint.
export async function punchClock() {
  const { profile } = await requireRole("employee");
  if (!profile?.employee_id) return { error: "Your account is not linked to an employee record" };

  const supabase = await createClient();
  const { company, holidays } = await getCompanyContext();
  if (!company) return { error: "Company is not configured" };

  const now = new Date();
  const zoned = zonedParts(now, company.timezone);
  const today = zoned.dateISO;

  // Weekend / holiday guard (company calendar).
  const type = dayType(today, { weekendDays: company.weekend_days, holidays });
  if (type !== "workday") {
    return { error: `Today is a ${type} — attendance is not recorded.` };
  }

  // Employment eligibility.
  const { data: employee } = await supabase
    .from("employees")
    .select("id, status, join_date")
    .eq("id", profile.employee_id)
    .single();
  if (!employee || employee.status === "exited") {
    return { error: "Your employment is not active" };
  }
  if (employee.join_date > today) {
    return { error: "Your employment has not started yet" };
  }

  const { data: record } = await supabase
    .from("attendance_records")
    .select("id, check_in, check_out, status")
    .eq("employee_id", profile.employee_id)
    .eq("work_date", today)
    .maybeSingle();

  if (record?.check_in && record?.check_out) {
    return { error: "You have already checked in and out today." };
  }

  if (!record) {
    // ── Check in ──
    const status = statusForCheckIn(zoned.minutes, {
      officeStart: company.office_start,
      graceMinutes: company.grace_minutes,
    });
    const { error } = await supabase.from("attendance_records").insert({
      employee_id: profile.employee_id,
      work_date: today,
      check_in: now.toISOString(),
      status,
      source: "web",
    });
    if (error) return { error: error.message };
    revalidatePath("/me/attendance");
    revalidatePath("/me/dashboard");
    return {
      ok: true,
      action: "check_in",
      status,
      time: zoned.time,
      message: status === "late" ? "Checked in (late)." : "Checked in.",
    };
  }

  // ── Check out ──
  const worked = workedMinutes(record.check_in, now.toISOString());
  const scheduled = scheduledMinutes({
    officeStart: company.office_start,
    officeEnd: company.office_end,
  });
  const finalStatus = statusForCheckOut(record.status, worked, scheduled);

  const { error } = await supabase
    .from("attendance_records")
    .update({ check_out: now.toISOString(), worked_minutes: worked, status: finalStatus })
    .eq("id", record.id);
  if (error) return { error: error.message };

  revalidatePath("/me/attendance");
  revalidatePath("/me/dashboard");
  return {
    ok: true,
    action: "check_out",
    status: finalStatus,
    time: zoned.time,
    message:
      finalStatus === "half_day"
        ? `Checked out — recorded as a half day (${Math.floor(worked / 60)}h ${worked % 60}m worked).`
        : `Checked out — ${Math.floor(worked / 60)}h ${worked % 60}m worked.`,
  };
}

export async function requestCorrection({ recordId, checkIn, checkOut, reason }) {
  const { profile } = await requireRole("employee");
  if (!profile?.employee_id) return { error: "Your account is not linked to an employee record" };

  const why = String(reason ?? "").trim();
  if (!why) return { error: "A reason is required" };
  if (checkIn && !TIME_RE.test(checkIn)) return { error: "Check-in time must be HH:MM" };
  if (checkOut && !TIME_RE.test(checkOut)) return { error: "Check-out time must be HH:MM" };
  if (!checkIn && !checkOut) return { error: "Propose a corrected check-in and/or check-out time" };

  const supabase = await createClient();
  const { data: record } = await supabase
    .from("attendance_records")
    .select("id, employee_id, work_date, status")
    .eq("id", recordId)
    .single();

  // RLS already scopes reads to own rows; double-check ownership explicitly.
  if (!record || record.employee_id !== profile.employee_id) {
    return { error: "Attendance record not found" };
  }
  if (record.status === "on_leave") return { error: "Leave days are corrected through leave requests" };

  const { error } = await supabase.from("attendance_corrections").insert({
    attendance_record_id: record.id,
    employee_id: profile.employee_id,
    requested: { check_in: checkIn || null, check_out: checkOut || null },
    reason: why,
  });
  if (error) return { error: error.message };

  revalidatePath("/me/attendance");
  return { ok: true };
}
