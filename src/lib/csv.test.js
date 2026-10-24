import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, validateRows, buildCsv } from "./csv.js";

test("parseCsv handles quoted fields, escaped quotes, CRLF, BOM", () => {
  const csv = "\uFEFFemp_code,full_name,email\r\nE1,\"Doe, John\",a@b.c\r\nE2,\"say \"\"hi\"\"\",d@e.f\r\n";
  const rows = parseCsv(csv);
  assert.deepEqual(rows[0], ["emp_code", "full_name", "email"]);
  assert.deepEqual(rows[1], ["E1", "Doe, John", "a@b.c"]);
  assert.deepEqual(rows[2], ["E2", 'say "hi"', "d@e.f"]);
});

test("parseCsv keeps empty trailing lines out", () => {
  assert.equal(parseCsv("a,b\n1,2\n\n").length, 2);
});

const lookups = {
  existing: [{ emp_code: "E1", email: "taken@x.com" }],
  departments: [{ id: 1, name: "Engineering" }],
  designations: [{ id: 2, name: "Developer" }],
};

test("validateRows accepts a good row and resolves lookups later at commit", () => {
  const { valid, invalid } = validateRows(
    parseCsv("emp_code,full_name,email,join_date,status,department,designation\nE9,New Guy,new@x.com,2026-01-05,active,Engineering,Developer"),
    lookups
  );
  assert.equal(invalid.length, 0);
  assert.equal(valid.length, 1);
  assert.equal(valid[0].emp_code, "E9");
  assert.equal(valid[0].department, "Engineering");
});

test("validateRows rejects missing required fields and unknown lookups", () => {
  const { invalid } = validateRows(
    parseCsv("emp_code,full_name,email,join_date,status,department,designation\n,No Code,bad-email,05-01-2026,active,Nope,Nada"),
    lookups
  );
  assert.equal(invalid.length, 1);
  const errs = invalid[0].errors.join("; ");
  assert.match(errs, /emp_code is required/);
  assert.match(errs, /valid email/);
  assert.match(errs, /join_date must be YYYY-MM-DD/);
  assert.match(errs, /unknown department/);
  assert.match(errs, /unknown designation/);
});

test("validateRows detects duplicates against existing and within the file", () => {
  const { invalid } = validateRows(
    parseCsv(
      "emp_code,full_name,email,join_date\nE1,Dup,taken@x.com,2026-01-01\nE1,Dup2,fresh@x.com,2026-01-02\nE1,Dup3,fresh@x.com,2026-01-03"
    ),
    lookups
  );
  const msgs = invalid.map((r) => r.errors.join("; ")).join(" | ");
  assert.match(msgs, /duplicate emp_code "E1"/);
  assert.match(msgs, /duplicate email "taken@x\.com"/);
  // second + third rows duplicate the emp_code within the file
  assert.match(msgs, /duplicate emp_code "E1".*duplicate emp_code "E1"|duplicate emp_code "E1"/);
});

test("validateRows defaults status to probation and lowercases gender", () => {
  const { valid } = validateRows(
    parseCsv("emp_code,full_name,email,join_date,gender\nE5,Person,p5@x.com,2026-02-01,MALE"),
    lookups
  );
  assert.equal(valid[0].status, "probation");
  assert.equal(valid[0].gender, "male");
});

test("buildCsv escapes commas and quotes, emits header + CRLF", () => {
  const csv = buildCsv([
    {
      emp_code: "E1",
      full_name: "Doe, John",
      email: "a@b.c",
      phone: "",
      gender: "male",
      dob: "",
      department: "Engineering",
      designation: "Developer",
      join_date: "2026-01-05",
      status: "active",
      address: 'Flat "4", Street 9',
    },
  ]);
  assert.match(csv, /^emp_code,full_name,email/);
  assert.match(csv, /"Doe, John"/);
  assert.match(csv, /"Flat ""4"", Street 9"/);
  assert.ok(csv.endsWith("\r\n"));
});
