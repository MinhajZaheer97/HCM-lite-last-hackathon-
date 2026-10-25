import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui";
import SimpleCrud from "@/components/features/SimpleCrud";
import CsvImport from "./csv-import";
import { saveEmployee } from "./actions";

export const metadata = { title: "Employees — HCM Lite" };

const STATUS_OPTIONS = [
  { value: "probation", label: "Probation" },
  { value: "active", label: "Active" },
  { value: "exited", label: "Exited" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default async function EmployeesPage({ searchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const dept = params.dept || "";
  const status = params.status || "";

  const supabase = await createClient();
  let query = supabase
    .from("employees")
    .select("id, emp_code, full_name, email, join_date, status, auth_user_id, department_id, designation_id")
    .order("emp_code");

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,emp_code.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (dept) query = query.eq("department_id", dept);
  if (status) query = query.eq("status", status);

  const [{ data: employees, error: employeeError }, { data: departments, error: departmentError }, { data: designations, error: designationError }] = await Promise.all([
    query,
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("designations").select("id, name").order("name"),
  ]);

  if (employeeError) throw new Error(`Unable to load employees: ${employeeError.message}`);
  if (departmentError) throw new Error(`Unable to load departments: ${departmentError.message}`);
  if (designationError) throw new Error(`Unable to load designations: ${designationError.message}`);

  const deptOptions = (departments ?? []).map((d) => ({ value: d.id, label: d.name }));
  const desigOptions = (designations ?? []).map((d) => ({ value: d.id, label: d.name }));
  const departmentsById = new Map((departments ?? []).map((d) => [String(d.id), d.name]));
  const designationsById = new Map((designations ?? []).map((d) => [String(d.id), d.name]));

  const displayRows = (employees ?? []).map((e) => ({
    ...e,
    department: departmentsById.get(String(e.department_id)) ?? "—",
    designation: designationsById.get(String(e.designation_id)) ?? "—",
    login: e.auth_user_id ? "Yes" : "No",
  }));

  const employeeFields = [
    { name: "emp_code", label: "Employee code", placeholder: "Auto-generated if empty" },
    { name: "full_name", label: "Full name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone" },
    { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
    { name: "dob", label: "Date of birth", type: "date" },
    { name: "department_id", label: "Department", type: "select", options: deptOptions },
    { name: "designation_id", label: "Designation", type: "select", options: desigOptions },
    { name: "join_date", label: "Join date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { name: "exit_date", label: "Exit date", type: "date" },
    { name: "address", label: "Address" },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        description="Register employees, maintain records, and manage logins."
        actions={
          <>
            <CsvImport />
            <a
              href="/api/employees/export"
              className="inline-flex items-center rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              Export CSV
            </a>
          </>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-2" action="/hr/employees">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, code, or email…"
          className="w-56 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <select
          name="dept"
          defaultValue={dept}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All departments</option>
          {deptOptions.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
        {(q || dept || status) && (
          <Link href="/hr/employees" className="px-2 py-2 text-sm text-ink-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      <SimpleCrud
        rows={displayRows}
        columns={[
          { key: "emp_code", label: "Code" },
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "department", label: "Department" },
          { key: "designation", label: "Designation" },
          { key: "join_date", label: "Joined" },
          { key: "status", label: "Status" },
          { key: "login", label: "Login" },
        ]}
        fields={employeeFields}
        saveAction={saveEmployee}
        deleteAction={null}
        linkKey="emp_code"
        linkHrefBase="/hr/employees"
        addLabel="Add employee"
        emptyTitle="No employees yet"
        emptyDescription="Register your first employee, or import a CSV — all records are created through the app."
      />
      <p className="mt-3 text-xs text-ink-muted">
        Click an employee code to open their 360° profile, where you can create their login.
        Deleting employees is intentionally not supported — mark them <em>exited</em> instead so
        historical records stay intact.
      </p>
    </>
  );
}
