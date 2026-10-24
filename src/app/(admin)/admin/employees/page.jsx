import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Badge, Button, Card, CardBody, EmptyState } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";

export const metadata = { title: "Employees — HCM Lite" };

const STATUS_TONE = {
  probation: "warning",
  active: "success",
  exited: "neutral",
};

export default async function AdminEmployees({ searchParams }) {
  await requireRole("admin");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const dept = typeof params.dept === "string" ? params.dept : "";
  const status = typeof params.status === "string" ? params.status : "";

  const supabase = await createClient();
  let query = supabase
    .from("employees")
    .select(
      "id, emp_code, full_name, email, join_date, status, auth_user_id, departments(id, name), designations(name)"
    )
    .order("emp_code");

  if (q) query = query.or(`full_name.ilike.%${q}%,emp_code.ilike.%${q}%,email.ilike.%${q}%`);
  if (dept) query = query.eq("department_id", dept);
  if (status) query = query.eq("status", status);

  const [{ data: employees }, { data: departments }] = await Promise.all([
    query,
    supabase.from("departments").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageHeader
        title="Employees"
        description="Company-wide employee directory. Employee records are maintained by HR."
        actions={
          <Link
            href="/hr/employees"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            Manage as HR
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-2" action="/admin/employees">
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
          {(departments ?? []).map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="probation">Probation</option>
          <option value="active">Active</option>
          <option value="exited">Exited</option>
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
        {(q || dept || status) && (
          <Link href="/admin/employees" className="px-2 py-2 text-sm text-ink-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      <Card>
        <CardBody className="p-0">
          {!employees?.length ? (
            <div className="p-5">
              <EmptyState
                title="No employees found"
                description={q || dept || status ? "Try changing the filters." : "Employees registered by HR will appear here."}
                icon="👥"
              />
            </div>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Code</TH>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Department</TH>
                  <TH>Designation</TH>
                  <TH>Joined</TH>
                  <TH>Status</TH>
                  <TH>Login</TH>
                </tr>
              </THead>
              <TBody>
                {employees.map((employee) => (
                  <TR key={employee.id}>
                    <TD>
                      <Link
                        href={`/hr/employees/${employee.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {employee.emp_code}
                      </Link>
                    </TD>
                    <TD className="font-medium">{employee.full_name}</TD>
                    <TD>{employee.email}</TD>
                    <TD>{employee.departments?.name ?? "—"}</TD>
                    <TD>{employee.designations?.name ?? "—"}</TD>
                    <TD>{employee.join_date}</TD>
                    <TD>
                      <Badge tone={STATUS_TONE[employee.status] ?? "neutral"}>
                        {employee.status}
                      </Badge>
                    </TD>
                    <TD>{employee.auth_user_id ? "Yes" : "No"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
