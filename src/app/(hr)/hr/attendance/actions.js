"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/attendance/context";
import { zonedToUtcISO, zonedParts } from "@/lib/dates/tz";
import { statusForCheckIn, statusForCheckOut, scheduledMinutes, workedMinutes } from "@/lib/attendance/rules";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function reviewCorrection({ correctionId, decision, comment }) {
  await requireRole(["hr", "admin"]);
  if (!["approved", "rejected"].includes(decision)) return { error: "Invalid decision" };

  const supabase = await createClient();
  const { data: correction } = await supabase
    .from("attendance_corrections")
    .select(
      `id, status, requested, attendance_record_id,
       attendance_records(id, employee_id, work_date, check_in, check_out, status)`
    )
    .eq("id", correctionId)
    .single();

  if (!correction) return { error: "Correction request not found" };
  if (correction.status !== "pending") return { error: "This request was already reviewed" };

  const { profile } = await requireRole(["hr", "admin"]);

  if (decision === "rejected") {
    const { error } = await supabase
      .from("attendance_corrections")
      .update({
        status: "rejected",
        reviewed_by: profile.id,
        review_comment: String(comment ?? "").trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", correctionId);
    if (error) return { error: error.message };
    revalidatePath("/hr/attendance");
    return { ok: true };
  }

  // ── Approve: apply proposed times, recompute status via the rules engine ──
  const record = correction.attendance_records;
  const requested = correction.requested ?? {};
  const checkInTime = requested.check_in;
  const checkOutTime = requested.check_out;

  if (checkInTime && !TIME_RE.test(checkInTime)) return { error: "Proposed check-in time is invalid" };
  if (checkOutTime && !TIME_RE.test(checkOutTime)) return { error: "Proposed check-out time is invalid" };

  const { company } = await getCompanyContext();
  const tz = company?.timezone ?? "Asia/Karachi";

  const newCheckIn = checkInTime
    ? zonedToUtcISO(record.work_date, checkInTime, tz)
    : record.check_in;
  const newCheckOut = checkOutTime
    ? zonedToUtcISO(record.work_date, checkOutTime, tz)
    : record.check_out;

  if (newCheckIn && newCheckOut && new Date(newCheckOut) <= new Date(newCheckIn)) {
    return { error: "Corrected check-out must be after check-in" };
  }

  let status = record.status;
  let worked = record.worked_minutes ?? null;
  if (newCheckIn) {
    status =
      record.status === "on_leave"
        ? "on_leave"
        : statusForCheckIn(zonedParts(new Date(newCheckIn), tz).minutes, {
            officeStart: company.office_start,
            graceMinutes: company.grace_minutes,
          });
  }
  if (newCheckIn && newCheckOut) {
    worked = workedMinutes(newCheckIn, newCheckOut);
    const scheduled = scheduledMinutes({
      officeStart: company.office_start,
      officeEnd: company.office_end,
    });
    status = statusForCheckOut(status, worked, scheduled);
  }

  const { error: recErr } = await supabase
    .from("attendance_records")
    .update({ check_in: newCheckIn, check_out: newCheckOut, worked_minutes: worked, status, source: "correction" })
    .eq("id", record.id);
  if (recErr) return { error: recErr.message };

  const { error: corrErr } = await supabase
    .from("attendance_corrections")
    .update({
      status: "approved",
      reviewed_by: profile.id,
      review_comment: String(comment ?? "").trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", correctionId);
  if (corrErr) return { error: corrErr.message };

  revalidatePath("/hr/attendance");
  revalidatePath("/me/attendance");
  return { ok: true };
}
