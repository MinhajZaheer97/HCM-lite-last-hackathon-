// CSV utilities for employee import/export. Pure functions — unit-tested
// with node:test. Import is a two-step dry-run process: validateRows()
// reports every problem per row; nothing is written until commit.

// ── Parsing ──────────────────────────────────────────────────────────
// RFC-4180-ish: quoted fields, escaped quotes (""), commas inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const src = String(text ?? "").replace(/^\uFEFF/, ""); // strip BOM
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

// ── Employee row schema ──────────────────────────────────────────────
export const CSV_COLUMNS = [
  "emp_code",
  "full_name",
  "email",
  "phone",
  "gender",
  "dob",
  "department",
  "designation",
  "join_date",
  "status",
  "address",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const STATUSES = ["probation", "active", "exited"];
const GENDERS = ["male", "female", "other"];

function clean(value) {
  return String(value ?? "").trim();
}

// Map a raw row to the employee schema. With a header row, fields are
// matched by name (order-independent); without one, positional order
// (CSV_COLUMNS) is assumed.
function normalize(row, headerMap) {
  const out = {};
  if (headerMap) {
    row.forEach((cell, i) => {
      const col = headerMap[i];
      if (col) out[col] = clean(cell);
    });
  } else {
    CSV_COLUMNS.forEach((col, i) => {
      out[col] = clean(row[i]);
    });
  }
  out.gender = (out.gender || "").toLowerCase();
  out.status = (out.status || "probation").toLowerCase();
  return out;
}

/**
 * Validate parsed CSV rows against existing employees and lookup tables.
 * Returns { valid: [row], invalid: [{ rowNumber, employee, errors: [] }] }.
 * `existing` = [{ emp_code, email }], `departments`/`designations` = [{ id, name }].
 */
export function validateRows(parsedRows, { existing = [], departments = [], designations = [] } = {}) {
  if (!parsedRows.length) {
    return { valid: [], invalid: [{ rowNumber: 1, employee: null, errors: ["File is empty"] }] };
  }

  // Header detection + column mapping by name.
  const firstRow = parsedRows[0].map(clean).map((h) => h.toLowerCase().replaceAll(" ", "_"));
  const knownCols = new Set(CSV_COLUMNS);
  const headerMap = firstRow
    .map((h, i) => (knownCols.has(h) ? { i, col: h } : null))
    .filter(Boolean);
  const hasHeader = headerMap.length >= 3 && firstRow.includes("emp_code") && firstRow.includes("full_name") && firstRow.includes("email");
  const colIndex = new Array(CSV_COLUMNS.length);
  headerMap.forEach(({ i, col }) => {
    colIndex[i] = col;
  });
  const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;

  const seenCodes = new Set(existing.map((e) => e.emp_code.toLowerCase()));
  const seenEmails = new Set(existing.map((e) => e.email.toLowerCase()));
  const valid = [];
  const invalid = [];

  dataRows.forEach((raw, idx) => {
    const rowNumber = idx + (hasHeader ? 2 : 1);
    const emp = normalize(raw, hasHeader ? colIndex : null);
    const errors = [];

    if (raw.length > CSV_COLUMNS.length) errors.push(`Too many columns (${raw.length}, expected ${CSV_COLUMNS.length})`);

    if (!emp.emp_code) errors.push("emp_code is required");
    if (!emp.full_name) errors.push("full_name is required");
    if (!EMAIL_RE.test(emp.email)) errors.push("a valid email is required");
    if (!DATE_RE.test(emp.join_date)) errors.push("join_date must be YYYY-MM-DD");
    if (emp.dob && !DATE_RE.test(emp.dob)) errors.push("dob must be YYYY-MM-DD or empty");
    if (emp.gender && !GENDERS.includes(emp.gender)) errors.push(`gender must be one of: ${GENDERS.join(", ")}`);
    if (!STATUSES.includes(emp.status)) errors.push(`status must be one of: ${STATUSES.join(", ")}`);
    if (emp.department && !departments.some((d) => d.name === emp.department))
      errors.push(`unknown department "${emp.department}"`);
    if (emp.designation && !designations.some((d) => d.name === emp.designation))
      errors.push(`unknown designation "${emp.designation}"`);

    const codeKey = (emp.emp_code || "").toLowerCase();
    const emailKey = (emp.email || "").toLowerCase();
    if (codeKey && seenCodes.has(codeKey)) errors.push(`duplicate emp_code "${emp.emp_code}"`);
    if (emailKey && seenEmails.has(emailKey)) errors.push(`duplicate email "${emp.email}"`);
    seenCodes.add(codeKey);
    seenEmails.add(emailKey);

    if (errors.length) invalid.push({ rowNumber, employee: emp, errors });
    else valid.push(emp);
  });

  return { valid, invalid };
}

// ── Export ───────────────────────────────────────────────────────────
function csvField(value) {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function buildCsv(employees) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const e of employees) {
    lines.push(
      [
        e.emp_code,
        e.full_name,
        e.email,
        e.phone,
        e.gender,
        e.dob,
        e.department,
        e.designation,
        e.join_date,
        e.status,
        e.address,
      ]
        .map(csvField)
        .join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}
