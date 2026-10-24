import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dayType,
  statusForCheckIn,
  scheduledMinutes,
  workedMinutes,
  statusForCheckOut,
  effectiveStatus,
} from "./rules.js";

test("dayType: weekend (Sun=0, Sat=6), holiday, workday", () => {
  // 2026-10-25 is a Sunday, 2026-10-24 a Saturday.
  assert.equal(dayType("2026-10-25", { weekendDays: [0, 6], holidays: [] }), "weekend");
  assert.equal(dayType("2026-10-24", { weekendDays: [0, 6], holidays: [] }), "weekend");
  assert.equal(dayType("2026-10-26", { weekendDays: [0, 6], holidays: [] }), "workday");
  assert.equal(dayType("2026-10-26", { weekendDays: [0, 6], holidays: ["2026-10-26"] }), "holiday");
});

test("statusForCheckIn respects grace window", () => {
  const cfg = { officeStart: "09:00", graceMinutes: 10 };
  assert.equal(statusForCheckIn(9 * 60, cfg), "present");
  assert.equal(statusForCheckIn(9 * 60 + 10, cfg), "present"); // exactly at deadline is OK
  assert.equal(statusForCheckIn(9 * 60 + 11, cfg), "late");
  assert.equal(statusForCheckIn(11 * 60, cfg), "late");
});

test("scheduledMinutes computes office duration", () => {
  assert.equal(scheduledMinutes({ officeStart: "09:00", officeEnd: "17:00" }), 480);
  assert.equal(scheduledMinutes({ officeStart: "10:00", officeEnd: "18:30" }), 510);
});

test("workedMinutes from ISO timestamps", () => {
  assert.equal(workedMinutes("2026-10-26T04:00:00Z", "2026-10-26T12:30:00Z"), 510);
  assert.equal(workedMinutes("2026-10-26T12:00:00Z", "2026-10-26T11:00:00Z"), 0); // clamped
});

test("statusForCheckOut: half-day below half the schedule, late kept otherwise", () => {
  const sched = 480;
  assert.equal(statusForCheckOut("present", 480, sched), "present");
  assert.equal(statusForCheckOut("present", 239, sched), "half_day");
  assert.equal(statusForCheckOut("present", 240, sched), "present"); // exactly half is a full day
  assert.equal(statusForCheckOut("late", 470, sched), "late");
  assert.equal(statusForCheckOut("late", 100, sched), "half_day");
});

test("effectiveStatus marks past check-ins without checkout as missing_checkout", () => {
  const today = "2026-10-26";
  assert.equal(effectiveStatus({ check_in: "x", check_out: null, work_date: "2026-10-25", status: "present" }, today), "missing_checkout");
  assert.equal(effectiveStatus({ check_in: "x", check_out: null, work_date: today, status: "present" }, today), "present");
  assert.equal(effectiveStatus({ check_in: "x", check_out: "y", work_date: "2026-10-25", status: "late" }, today), "late");
});
