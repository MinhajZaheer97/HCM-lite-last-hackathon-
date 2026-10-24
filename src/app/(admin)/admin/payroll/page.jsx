import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import FinalizeButton from "./finalize-button";
export const metadata = { title: "Payroll — HCM Lite" };
export default async function AdminPayrollPage() {
  await requireRole("admin");
  const { data: runs } = await (await createClient()).from("payroll_runs").select("id, period_month, status, finalized_at, payslips(gross, total_deductions, net, employees(full_name, emp_code))").order("period_month", { ascending: false });
  return <><PageHeader title="Payroll" description="Review and finalize monthly payroll runs." /><Card><CardHeader title="Payroll runs" /><CardBody className="space-y-4">{!runs?.length ? <EmptyState title="No payroll runs" description="HR must generate a draft first." icon="💰" /> : runs.map((run) => { const gross = (run.payslips ?? []).reduce((sum, slip) => sum + Number(slip.gross), 0); const net = (run.payslips ?? []).reduce((sum, slip) => sum + Number(slip.net), 0); return <div key={run.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{run.period_month.slice(0, 7)}</p><p className="text-xs text-ink-muted">{run.payslips?.length ?? 0} payslips · gross {gross.toFixed(2)} · net {net.toFixed(2)}</p></div><div className="flex items-center gap-2"><Badge tone={run.status === "finalized" ? "success" : "warning"}>{run.status}</Badge>{run.status === "draft" && <FinalizeButton runId={run.id} />}</div></div></div>; })}</CardBody></Card></>;
}
