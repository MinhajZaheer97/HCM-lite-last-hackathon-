import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { attendanceSummary, headcount } from "@/lib/analytics/metrics";
export const metadata = { title: "HR Dashboard — HCM Lite" };
export default async function HrDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();
  const [{ data: employees }, { data: records }, { data: pending }] = await Promise.all([
    supabase.from("employees").select("status, join_date, exit_date"),
    supabase.from("attendance_records").select("status").eq("work_date", today),
    supabase.from("leave_requests").select("id").eq("status", "pending"),
  ]);
  const summary = attendanceSummary(records ?? []);
  return (
    <>
      <PageHeader title="HR Dashboard" description={`Day-to-day metrics for ${today}.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Headcount", headcount(employees ?? [], today)],
          ["Present today", summary.counts.present + summary.counts.late],
          ["On leave today", summary.counts.on_leave],
          ["Late today", summary.counts.late],
        ].map(([label, value]) => <Card key={label}><CardBody><p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></CardBody></Card>)}
      </div>
      <Card className="mt-4"><CardHeader title="Pending leave approvals" /><CardBody>{pending?.length ? <p className="text-sm">{pending.length} request(s) awaiting review. <a className="text-brand-700 hover:underline" href="/hr/leave">Review requests</a></p> : <EmptyState title="No pending approvals" description="New leave requests will appear here." icon="✅" />}</CardBody></Card>
    </>
  );
}
