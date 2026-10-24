import { test } from "node:test";
import assert from "node:assert/strict";
import { headcount, attendanceSummary, payrollSummary } from "./metrics.js";

test("headcount respects employment window", () => {
  assert.equal(headcount([
    { status: "active", join_date: "2026-01-01", exit_date: null },
    { status: "exited", join_date: "2026-01-01", exit_date: null },
    { status: "probation", join_date: "2026-12-01", exit_date: null },
  ], "2026-10-24"), 1);
});

test("attendance summary calculates weighted attendance", () => {
  const summary = attendanceSummary([{ status: "present" }, { status: "late" }, { status: "half_day" }, { status: "on_leave" }]);
  assert.equal(summary.attendanceRate, 83.3);
  assert.equal(summary.lateRate, 33.3);
});

test("payroll summary uses finalized runs only", () => {
  const summary = payrollSummary([
    { status: "draft", payslips: [{ gross: 100, net: 100 }] },
    { status: "finalized", payslips: [{ gross: 300, net: 280 }] },
  ]);
  assert.equal(summary.gross, 300);
  assert.equal(summary.averageSalary, 300);
});
