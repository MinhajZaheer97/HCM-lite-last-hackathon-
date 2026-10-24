import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePayslip } from "./calculate.js";

test("calculates gross, loss of pay and net", () => {
  const result = calculatePayslip({ basic: 30000, allowances: { transport: 2000 }, workingDays: 26, absentDays: 1, halfDays: 1 });
  assert.equal(result.gross, 32000);
  assert.equal(result.lopDays, 1.5);
  assert.equal(result.totalDeductions, 1846.15);
  assert.equal(result.net, 30153.85);
});

test("zero working days does not produce invalid numbers", () => {
  const result = calculatePayslip({ basic: 1000, workingDays: 0, absentDays: 1 });
  assert.equal(result.totalDeductions, 0);
  assert.equal(result.net, 1000);
});
