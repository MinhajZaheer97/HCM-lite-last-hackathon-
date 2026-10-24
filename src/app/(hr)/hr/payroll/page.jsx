import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState, Badge } from "@/components/ui";
import { DraftForm, SalaryForm } from "./payroll-controls";
export const metadata = { title: "Payroll — HCM Lite" };
export default async function HrPayrollPage() {
  await requireRole(["hr", "admin"]);
  const supabase = await createClient();
  const [{ data: employees }, { data: runs }] = await Promise.all([
    supabase.from("employees").select("id, emp_code, full_name, salary_structures(basic, allowances, effective_from)").in("status", ["active", "probation"]).order("emp_code"),
    supabase.from("payroll_runs").select("id, period_month, status, drafted_at, payslips(id, employee_id, gross, total_deductions, net, days_worked, lop_days, employees(full_name, emp_code))").order("period_month", { ascending: false }),
  ]);
  return <><PageHeader title="Payroll" description="Salary structures and monthly payroll drafts." /><Card className="mb-4"><CardHeader title="Generate monthly draft" /><CardBody><DraftForm /></CardBody></Card><Card className="mb-4"><CardHeader title="Salary structures" subtitle="Allowances format: Label:Amount, comma-separated." /><CardBody className="space-y-3">{!employees?.length ? <EmptyState title="No active employees" description="Register employees before configuring payroll." icon="💰" /> : employees.map((employee) => <SalaryForm key={employee.id} employee={{ ...employee, salary: employee.salary_structures?.[0] }} />)}</CardBody></Card><Card><CardHeader title="Payroll drafts" /><CardBody className="space-y-4">{!runs?.length ? <EmptyState title="No payroll runs" description="Generate a monthly draft after setting salaries." icon="🧾" /> : runs.map((run) => <div key={run.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap justify-between gap-2"><div className="font-medium">{run.period_month.slice(0, 7)}</div><Badge tone={run.status === "finalized" ? "success" : "warning"}>{run.status}</Badge></div><p className="mt-1 text-xs text-ink-muted">{run.payslips?.length ?? 0} payslips · totals update when draft is regenerated</p></div>)}</CardBody></Card></>;
}
