import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import FinalizeButton from "./finalize-button";
export const metadata = { title: "Payroll — HCM Lite" };
export default async function AdminPayrollPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: runs, error } = await supabase
    .from("payroll_runs")
    .select("id, period_month, status, finalized_at, payslips(employee_id, gross, total_deductions, net, days_worked, lop_days)")
    .order("period_month", { ascending: false });
  if (error) throw new Error(`Unable to load payroll: ${error.message}`);

  const employeeIds = [...new Set((runs ?? []).flatMap((run) => (run.payslips ?? []).map((slip) => slip.employee_id)))];
  const { data: employees, error: employeeError } = employeeIds.length
    ? await supabase.from("employees").select("id, full_name, emp_code").in("id", employeeIds)
    : { data: [], error: null };
  if (employeeError) throw new Error(`Unable to load payroll employees: ${employeeError.message}`);
  const employeeById = new Map((employees ?? []).map((employee) => [employee.id, employee]));

  return <><PageHeader title="Payroll" description="Review and finalize monthly payroll runs." /><Card><CardHeader title="Payroll runs" /><CardBody className="space-y-4">{!runs?.length ? <EmptyState title="No payroll runs" description="HR must generate a draft first." icon="💰" /> : runs.map((run) => { const gross = (run.payslips ?? []).reduce((sum, slip) => sum + Number(slip.gross), 0); const net = (run.payslips ?? []).reduce((sum, slip) => sum + Number(slip.net), 0); return <div key={run.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{run.period_month.slice(0, 7)}</p><p className="text-xs text-ink-muted">{run.payslips?.length ?? 0} payslips · gross {gross.toFixed(2)} · net {net.toFixed(2)}</p></div><div className="flex items-center gap-2"><Badge tone={run.status === "finalized" ? "success" : "warning"}>{run.status}</Badge>{run.status === "draft" && <FinalizeButton runId={run.id} />}</div></div>{run.payslips?.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-border text-xs text-ink-muted"><tr><th className="px-2 py-2">Employee</th><th className="px-2 py-2">Basic record</th><th className="px-2 py-2">Gross</th><th className="px-2 py-2">Deductions</th><th className="px-2 py-2">Net</th><th className="px-2 py-2">LOP days</th></tr></thead><tbody>{run.payslips.map((slip) => { const employee = employeeById.get(slip.employee_id); return <tr key={slip.employee_id} className="border-b border-border last:border-0"><td className="px-2 py-2 font-medium">{employee?.full_name ?? "Unknown employee"}<span className="ml-2 text-xs text-ink-muted">{employee?.emp_code ?? ""}</span></td><td className="px-2 py-2">{Number(slip.days_worked ?? 0).toFixed(1)} days worked</td><td className="px-2 py-2">{Number(slip.gross).toFixed(2)}</td><td className="px-2 py-2">{Number(slip.total_deductions).toFixed(2)}</td><td className="px-2 py-2 font-medium">{Number(slip.net).toFixed(2)}</td><td className="px-2 py-2">{Number(slip.lop_days ?? 0).toFixed(1)}</td></tr>; })}</tbody></table></div> : null}</div>; })}</CardBody></Card></>;
}
