import test from "node:test";
import assert from "node:assert/strict";
import { boundedDateRange, validateMessages } from "./config.js";

test("validateMessages accepts supported chat messages", () => {
  assert.deepEqual(validateMessages([{ role: "user", content: "  hello  " }]), [{ role: "user", content: "hello" }]);
});

test("validateMessages rejects oversized and unsupported messages", () => {
  assert.throws(() => validateMessages([{ role: "system", content: "hello" }]), /Invalid message format/);
  assert.throws(() => validateMessages([{ role: "user", content: "x".repeat(2001) }]), /characters/);
});

test("boundedDateRange applies defaults and rejects reversed ranges", () => {
  assert.deepEqual(boundedDateRange({ start_date: "2026-01-01", end_date: "2026-01-31" }), { start: "2026-01-01", end: "2026-01-31" });
  assert.throws(() => boundedDateRange({ start_date: "2026-02-01", end_date: "2026-01-01" }), /before/);
});
