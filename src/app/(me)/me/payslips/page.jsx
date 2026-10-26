import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
export const metadata = { title: "My Payslips — HCM Lite" };
export default async function MyPayslipsPage() {
  const { profile } = await requireRole("employee");
  const { data: slips } = await (await createClient())
    .from("payslips")
    .select("id, gross, total_deductions, net, days_worked, lop_days, payroll_runs!inner(period_month, status)")
    .eq("employee_id", profile.employee_id)
    .order("id", { ascending: false });
  return <><PageHeader title="My Payslips" description="View and download your finalized payslips." /><Card><CardHeader title="Payslips" /><CardBody className="space-y-3">{!slips?.length ? <EmptyState title="No payslips yet" description="Finalized payroll payslips will appear here." icon="🧾" /> : slips.map((slip) => <div key={slip.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"><div><p className="font-medium">{slip.payroll_runs?.period_month?.slice(0, 7)}</p><p className="text-sm text-ink-muted">Net {Number(slip.net).toFixed(2)} · deductions {Number(slip.total_deductions).toFixed(2)} · LOP {slip.lop_days} days</p></div><div className="flex items-center gap-2"><Badge tone={slip.payroll_runs?.status === "finalized" ? "success" : "warning"}>{slip.payroll_runs?.status}</Badge>{slip.payroll_runs?.status === "finalized" && <a className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" href={`/api/payslips/${slip.id}/pdf`}>Download PDF</a>}</div></div>)}</CardBody></Card></>;
}
