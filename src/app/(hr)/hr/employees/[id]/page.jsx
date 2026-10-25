import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import CreateLoginButton from "./create-login";

export const metadata = { title: "Employee Profile — HCM Lite" };

// 360° employee profile: personal + job info, login status, and records.
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

  const [
    { data: profileRow, error: profileError },
    { data: attendance, error: attendanceError },
    { data: leaveRequests, error: leaveError },
    { data: salary, error: salaryError },
    { data: payslips, error: payslipError },
  ] = await Promise.all([
    supabase.from("profiles").select("id, is_active").eq("employee_id", employee.id).maybeSingle(),
    supabase
      .from("attendance_records")
      .select("work_date, status, worked_minutes")
      .eq("employee_id", employee.id)
      .order("work_date", { ascending: false })
      .limit(30),
    supabase
      .from("leave_requests")
      .select("start_date, end_date, days, status, leave_types(name)")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("salary_structures")
      .select("basic, allowances, effective_from")
      .eq("employee_id", employee.id)
      .maybeSingle(),
    supabase
      .from("payslips")
      .select("gross, total_deductions, net, payroll_runs(period_month, status)")
      .eq("employee_id", employee.id)
      .order("id", { ascending: false })
      .limit(3),
  ]);

  const queryError = [profileError, attendanceError, leaveError, salaryError, payslipError].find(Boolean);
  if (queryError) throw new Error(queryError.message);

  const attendanceRows = attendance ?? [];
  const leaveRows = leaveRequests ?? [];
  const payslipRows = payslips ?? [];
  const presentDays = attendanceRows.filter((row) =>
    ["present", "late", "half_day"].includes(row.status),
  ).length;
  const leaveDays = leaveRows
    .filter((row) => row.status === "approved")
    .reduce((total, row) => total + Number(row.days || 0), 0);
  const allowanceTotal = Object.values(salary?.allowances ?? {}).reduce(
    (total, amount) => total + Number(amount || 0),
    0,
  );
  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

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
          <CardHeader title="Records" subtitle="Attendance, leave, salary, and payroll summary." />
          <CardBody className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Attendance</p>
              <p className="text-ink-muted">
                {attendanceRows.length
                  ? `${presentDays} present or late days in the latest ${attendanceRows.length} records`
                  : "No attendance records yet."}
              </p>
            </div>
            <div>
              <p className="font-medium">Leave</p>
              <p className="text-ink-muted">
                {leaveRows.length
                  ? `${leaveDays} approved day${leaveDays === 1 ? "" : "s"} · latest: ${
                      leaveRows[0].leave_types?.name ?? "Leave request"
                    } (${leaveRows[0].status})`
                  : "No leave requests yet."}
              </p>
            </div>
            <div>
              <p className="font-medium">Salary structure</p>
              <p className="text-ink-muted">
                {salary
                  ? `Basic ${formatMoney(salary.basic)} · allowances ${formatMoney(allowanceTotal)}`
                  : "No salary structure configured yet."}
              </p>
            </div>
            <div>
              <p className="font-medium">Payslips</p>
              <p className="text-ink-muted">
                {payslipRows.length
                  ? `${payslipRows.length} recent payslip${payslipRows.length === 1 ? "" : "s"} · latest net ${formatMoney(
                      payslipRows[0].net,
                    )}`
                  : "No payslips finalized yet."}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
