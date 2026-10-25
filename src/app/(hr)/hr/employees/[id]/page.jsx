import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import CreateLoginButton from "./create-login";

export const metadata = { title: "Employee Profile — HCM Lite" };

// 360° employee profile: personal + job info, login status, and the record
// areas (attendance, leave, payroll) that fill in as those phases land.
export default async function EmployeeProfilePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select(
      `id, emp_code, full_name, email, phone, gender, dob, address, join_date, exit_date,
       status, auth_user_id, created_at,
       departments(name), designations(name)`
    )
    .eq("id", id)
    .single();

  if (!employee) notFound();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("employee_id", employee.id)
    .maybeSingle();

  const rows = [
    ["Employee code", employee.emp_code],
    ["Email", employee.email],
    ["Phone", employee.phone ?? "—"],
    ["Gender", employee.gender ?? "—"],
    ["Date of birth", employee.dob ?? "—"],
    ["Address", employee.address ?? "—"],
  ];
  const jobRows = [
    ["Department", employee.departments?.name ?? "—"],
    ["Designation", employee.designations?.name ?? "—"],
    ["Join date", employee.join_date],
    ["Exit date", employee.exit_date ?? "—"],
    ["Employment status", employee.status],
  ];

  return (
    <>
      <PageHeader
        title={employee.full_name}
        description={`${employee.emp_code} · joined ${employee.join_date}`}
        actions={
          <Link
            href="/hr/employees"
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            ← Back to directory
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal information" />
          <CardBody>
            <dl className="space-y-2 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Job & employment" />
          <CardBody>
            <dl className="space-y-2 text-sm">
              {jobRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-right font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Login access"
            subtitle="Employee self-service: check-in/out, leave, payslips."
          />
          <CardBody>
            {employee.auth_user_id ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge tone="success">login created</Badge>
                  <span className="text-ink-muted">
                    {profileRow && !profileRow.is_active ? "Access deactivated" : "Active"}
                  </span>
                </div>
                <CreateLoginButton
                  employeeId={employee.id}
                  employeeName={employee.full_name}
                  hasLogin
                />
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm text-ink-muted">
                  No login yet — the employee cannot sign in until one is created.
                </p>
                <CreateLoginButton employeeId={employee.id} employeeName={employee.full_name} />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Records" subtitle="Populated by later phases." />
          <CardBody className="space-y-2 text-sm text-ink-muted">
            <p>📅 Attendance history & corrections — Phase 5</p>
            <p>🌴 Leave balances & request history — Phase 6</p>
            <p>💰 Salary structure & payslips — Phase 7</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
