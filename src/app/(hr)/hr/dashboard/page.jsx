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
    <div className="space-y-5">
      <PageHeader title="Dashboard" description={`Workforce operations for ${today}.`} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Headcount", headcount(employees ?? [], today)],
          ["Present today", summary.counts.present + summary.counts.late],
          ["On leave today", summary.counts.on_leave],
          ["Late today", summary.counts.late],
        ].map(([label, value]) => <Card key={label}><CardBody className="p-5"><div className="flex items-center justify-between"><p className="text-[13px] font-medium text-[#64748B]">{label}</p><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#EFF6FF] text-xs font-bold text-[#2563EB]">HR</span></div><p className="mt-3 text-[28px] font-bold leading-none tracking-[-0.02em] text-[#10264A]">{value}</p></CardBody></Card>)}
      </div>
      <Card><CardHeader title="Pending leave approvals" /><CardBody>{pending?.length ? <p className="text-[13px] text-[#64748B]">{pending.length} request(s) awaiting review. <a className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]" href="/hr/leave">Review requests →</a></p> : <EmptyState title="No pending approvals" description="New leave requests will appear here." icon="✅" />}</CardBody></Card>
    </div>
  );
}
