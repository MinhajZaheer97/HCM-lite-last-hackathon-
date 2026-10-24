// Pure attendance rules — no I/O, unit-tested in rules.test.js.
// Documented business rules (v1):
// - Late: check-in after office start + grace minutes.
// - Half-day: worked minutes < half the scheduled duration (8h → < 4h).
// - Missing checkout: checked in, never checked out, and the day has ended.
// - Weekends/holidays are not working days: no check-in, not counted.

export function dayType(dateISO, { weekendDays = [], holidays = [] }) {
  if (holidays.includes(dateISO)) return "holiday";
  const weekday = new Date(`${dateISO}T12:00:00Z`).getUTCDay();
  if (weekendDays.includes(weekday)) return "weekend";
  return "workday";
}

export function statusForCheckIn(checkInMinutes, { officeStart = "09:00", graceMinutes = 10 }) {
  const [h, m] = String(officeStart).split(":").map(Number);
  const deadline = h * 60 + m + Number(graceMinutes);
  return checkInMinutes > deadline ? "late" : "present";
}

export function scheduledMinutes({ officeStart = "09:00", officeEnd = "17:00" }) {
  const toMin = (t) => {
    const [h, m] = String(t).split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(officeEnd) - toMin(officeStart);
}

export function workedMinutes(checkInISO, checkOutISO) {
  const ms = new Date(checkOutISO) - new Date(checkInISO);
  return Math.max(0, Math.round(ms / 60000));
}

// Status once a check-out exists (or a correction is applied).
export function statusForCheckOut(initialStatus, worked, scheduled) {
  return worked < scheduled / 2 ? "half_day" : initialStatus;
}

// Display status for a record on a given "today" (company tz): a past day
// with a check-in but no check-out shows as missing_checkout.
export function effectiveStatus(record, todayISO) {
  if (record.check_in && !record.check_out && record.work_date < todayISO) {
    return "missing_checkout";
  }
  return record.status;
}
