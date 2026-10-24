import { test } from "node:test";
import assert from "node:assert/strict";
import { listWorkingDates, requestedLeaveDays, leaveBalance } from "./rules.js";

test("working dates exclude weekends and holidays", () => {
  assert.deepEqual(
    listWorkingDates("2026-10-23", "2026-10-27", { weekendDays: [0, 6], holidays: ["2026-10-26"] }),
    ["2026-10-23", "2026-10-27"]
  );
});

test("half-day is only valid for one working date", () => {
  assert.equal(requestedLeaveDays("2026-10-23", "2026-10-23", {}, true), 0.5);
  assert.equal(requestedLeaveDays("2026-10-23", "2026-10-26", {}, true), 0);
});

test("leave balance never goes below zero", () => {
  assert.equal(leaveBalance(12, 4), 8);
  assert.equal(leaveBalance(2, 4), 0);
});
