import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/attendance/context";
import { zonedParts } from "@/lib/dates/tz";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
export const metadata = { title: "My Dashboard — HCM Lite" };
export default async function EmployeeDashboard() {
  const { profile } = await requireRole("employee");
  const supabase = await createClient();
  const { company } = await getCompanyContext();
  const today = zonedParts(new Date(), company?.timezone ?? "Asia/Karachi").dateISO;
  const weekStart = new Date(`${today}T12:00:00Z`); weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  const [{ data: todayRecord }, { data: weekRecords }, { data: leaveTypes }, { data: leaves }, { data: payslip }] = await Promise.all([
    supabase.from("attendance_records").select("check_in, check_out, status").eq("employee_id", profile.employee_id).eq("work_date", today).maybeSingle(),
    supabase.from("attendance_records").select("worked_minutes, status").eq("employee_id", profile.employee_id).gte("work_date", weekStart.toISOString().slice(0, 10)).lte("work_date", today),
    supabase.from("leave_types").select("id, name, annual_days"),
    supabase.from("leave_requests").select("leave_type_id, days, status").eq("employee_id", profile.employee_id).in("status", ["pending", "approved"]),
    supabase
      .from("payslips")
      .select("net, payroll_runs!inner(period_month, status)")
      .eq("employee_id", profile.employee_id)
      .eq("payroll_runs.status", "finalized")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const hours = (weekRecords ?? []).reduce((sum, record) => sum + Number(record.worked_minutes ?? 0), 0) / 60;
  const used = (leaves ?? []).reduce((map, leave) => { map[leave.leave_type_id] = (map[leave.leave_type_id] ?? 0) + Number(leave.days); return map; }, {});
  const leaveBalance = (leaveTypes ?? []).reduce((sum, type) => sum + Math.max(0, Number(type.annual_days) - (used[type.id] ?? 0)), 0);
  return (
    <div className="space-y-5">
      <PageHeader title="My Dashboard" description="Your attendance, leave, and payroll at a glance." />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[["Check-in", todayRecord?.check_in ? "Recorded" : "Not yet"], ["Hours this week", `${hours.toFixed(1)} / 40h`], ["Late arrivals", (weekRecords ?? []).filter((record) => record.status === "late").length], ["Leave balance", `${leaveBalance} day(s)`]].map(([label, value]) =>
          <Card key={label}><CardBody className="p-5"><p className="text-[13px] font-medium text-[#64748B]">{label}</p><p className="mt-3 text-[28px] font-bold leading-none tracking-[-0.02em] text-[#10264A]">{value}</p></CardBody></Card>
        )}
      </div>
      <Card><CardHeader title="Latest payslip" /><CardBody>{payslip ? <p className="text-[13px] text-[#64748B]">Period {payslip.payroll_runs?.period_month?.slice(0, 7)} · net {Number(payslip.net).toFixed(2)} · <a className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]" href="/me/payslips">View payslips →</a></p> : <EmptyState title="No finalized payslip" description="A finalized payroll payslip will appear here." icon="🧾" />}</CardBody></Card>
    </div>
  );
}
