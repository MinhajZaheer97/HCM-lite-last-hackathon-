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
    supabase.from("payroll_runs").select("id, period_month, status, drafted_at, payslips(id, employee_id, gross, total_deductions, net, days_worked, lop_days)").order("period_month", { ascending: false }),
  ]);
  const employeeById = new Map((employees ?? []).map((employee) => [employee.id, employee]));
  return <><PageHeader title="Payroll" description="Salary structures and monthly payroll drafts." /><Card className="mb-4"><CardHeader title="Generate monthly draft" /><CardBody><DraftForm /></CardBody></Card><Card className="mb-4"><CardHeader title="Salary structures" subtitle="Allowances format: Label:Amount, comma-separated." /><CardBody className="space-y-3">{!employees?.length ? <EmptyState title="No active employees" description="Register employees before configuring payroll." icon="💰" /> : employees.map((employee) => <SalaryForm key={employee.id} employee={{ ...employee, salary: employee.salary_structures?.[0] }} />)}</CardBody></Card><Card><CardHeader title="Payroll drafts" /><CardBody className="space-y-4">{!runs?.length ? <EmptyState title="No payroll runs" description="Generate a monthly draft after setting salaries." icon="🧾" /> : runs.map((run) => <div key={run.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap justify-between gap-2"><div className="font-medium">{run.period_month.slice(0, 7)}</div><Badge tone={run.status === "finalized" ? "success" : "warning"}>{run.status}</Badge></div><p className="mt-1 text-xs text-ink-muted">{run.payslips?.length ?? 0} payslips</p>{run.payslips?.length ? <div className="mt-3 space-y-2 text-sm">{run.payslips.map((slip) => { const employee = employeeById.get(slip.employee_id); return <div key={slip.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-border px-3 py-2"><span className="font-medium">{employee?.full_name ?? "Unknown employee"} <span className="text-xs text-ink-muted">{employee?.emp_code ?? ""}</span></span><span>Gross {Number(slip.gross).toFixed(2)} · Net {Number(slip.net).toFixed(2)} · LOP {Number(slip.lop_days ?? 0).toFixed(1)}</span></div>; })}</div> : null}</div>)}</CardBody></Card></>;
}
