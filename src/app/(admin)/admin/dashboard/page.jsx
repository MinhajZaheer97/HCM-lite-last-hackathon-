import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { headcount, attendanceSummary, payrollSummary } from "@/lib/analytics/metrics";
import { AttendanceChart, DepartmentChart } from "@/components/features/dashboard/DashboardCharts";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard — HCM Lite" };

export default async function AdminDashboard({ searchParams }) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : today;
  const supabase = await createClient();
  const sevenDays = new Date(`${date}T12:00:00Z`);
  sevenDays.setUTCDate(sevenDays.getUTCDate() - 6);
  const startDate = sevenDays.toISOString().slice(0, 10);
  const [{ data: employees }, { data: records }, { data: runs }, { data: departments }, { data: weeklyRecords }, { data: pendingLeaves }, { data: audit }] = await Promise.all([
    supabase.from("employees").select("id, full_name, status, join_date, exit_date, department_id, departments(name)"),
    supabase.from("attendance_records").select("status, work_date").eq("work_date", date),
    supabase.from("payroll_runs").select("status, payslips(gross, net)"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("attendance_records").select("status, work_date").gte("work_date", startDate).lte("work_date", date),
    supabase.from("leave_requests").select("id").eq("status", "pending"),
    supabase.from("audit_logs").select("id, action, entity, entity_id, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
  ]);
  const attendance = attendanceSummary(records ?? []);
  const payroll = payrollSummary(runs ?? []);
  const departmentsById = new Map((departments ?? []).map((department) => [department.id, department.name]));
  const deptCounts = (employees ?? []).reduce((map, employee) => {
    const name = departmentsById.get(employee.department_id) ?? "Unassigned";
    map.set(name, (map.get(name) ?? 0) + (["active", "probation"].includes(employee.status) ? 1 : 0));
    return map;
  }, new Map());
  const departmentData = [...deptCounts]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  const attendanceByDay = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(`${date}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - (6 - i));
    const iso = day.toISOString().slice(0, 10);
    const dayRecords = (weeklyRecords ?? []).filter((record) => record.work_date === iso);
    attendanceByDay.push({
      day: day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      present: dayRecords.filter((record) => ["present", "late", "missing_checkout", "half_day"].includes(record.status)).length,
    });
  }
  const totalHeadcount = headcount(employees ?? [], date);
  const metrics = [
    ["Total Employees", totalHeadcount, "users", "bg-[#EFF6FF] text-[#2563EB]", `${(employees ?? []).filter((employee) => employee.join_date >= startDate && employee.join_date <= date).length} joined in this period`],
    ["Present Today", attendance.counts.present + attendance.counts.late, "calendar", "bg-[#EFF6FF] text-[#2563EB]", `${attendance.attendanceRate}% attendance rate`],
    ["Pending Leave", pendingLeaves?.length ?? 0, "leave", "bg-amber-50 text-amber-600", "requests awaiting decision"],
    ["Monthly Payroll", payroll.gross ? `${payroll.gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "No data", "wallet", "bg-[#EFF6FF] text-[#2563EB]", `${payroll.runs} finalized run(s)`],
  ];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Workforce Overview"
        actions={
          <form className="flex items-center gap-2" action="/admin/dashboard">
            <label className="sr-only" htmlFor="dashboard-date">Dashboard date</label>
            <input id="dashboard-date" className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12.5px] font-medium text-[#10264A] focus:border-[#2563EB] focus:outline-none" type="date" name="date" defaultValue={date} />
            <button className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12.5px] font-medium text-[#10264A] hover:bg-[#F8FAFC]" type="submit">Apply</button>
          </form>
        }
      />

      <section aria-label="Key workforce metrics" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, icon, iconStyle, detail]) => (
          <Card key={label}>
            <CardBody className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#64748B]">{label}</span>
                <div className={`grid h-9 w-9 place-items-center rounded-lg ${iconStyle}`}>
                  <span aria-hidden="true" className="text-sm font-bold">{icon === "users" ? "U" : icon === "calendar" ? "C" : icon === "leave" ? "L" : "P"}</span>
                </div>
              </div>
              <p className="mt-3 text-[28px] font-bold leading-none tracking-[-0.02em] text-[#10264A]">{value}</p>
              <p className="mt-3 text-[12px] text-[#64748B]">{detail}</p>
            </CardBody>
          </Card>
        ))}
      </section>

      <section aria-label="Workforce analytics" className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardBody className="p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[#10264A]">Attendance Overview</h2>
                <p className="mt-0.5 text-[12.5px] text-[#64748B]">Seven-day employee attendance</p>
              </div>
            </div>
            {weeklyRecords?.length ? <AttendanceChart data={attendanceByDay} /> : <EmptyState title="No attendance data" description="Attendance records will appear here." icon="📅" />}
          </CardBody>
        </Card>

        <Card className="lg:col-span-4">
          <CardBody className="p-6">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[#10264A]">Department Overview</h2>
            <p className="mt-0.5 text-[12.5px] text-[#64748B]">Headcount allocation by function</p>
            {departmentData.length ? (
              <>
                <DepartmentChart data={departmentData} />
                <div className="mt-1 border-t border-[#E2E8F0] pt-3">
                  {departmentData.map((department, index) => (
                    <div key={department.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-[#F5F8FD]">
                      <span className="flex items-center gap-2 font-medium text-[#10264A]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ["#0B1F3A", "#2563EB", "#60A5FA", "#0EA5E9", "#94A3B8"][index % 5] }} />
                        {department.name}
                      </span>
                      <span className="font-bold text-[#10264A]">{department.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="py-8"><EmptyState title="No department data" description="Department headcount will appear after employees are assigned." icon="🏢" /></div>}
          </CardBody>
        </Card>
      </section>

      <section aria-label="Recent HR activity" className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(11,31,58,0.04),0_4px_12px_rgba(11,31,58,0.02)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-6 py-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#10264A]">Recent Activity</h2>
          <Link href="/admin/audit" className="text-[12.5px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">View Audit Log →</Link>
        </div>
        {audit?.length ? (
          <div className="divide-y divide-[#E2E8F0]">
            {audit.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-[#F8FAFC]">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-[#10264A]">
                    <span className="font-semibold capitalize">{item.action}</span>
                    <span className="text-[#64748B]"> — {item.entity}</span>
                    {item.entity_id && <span className="text-[#64748B]"> · {item.entity_id}</span>}
                  </p>
                  <p className="mt-1 text-[11.5px] text-[#64748B]">{item.profiles?.full_name ?? "System"}</p>
                </div>
                <time className="shrink-0 text-[12px] text-[#64748B]">{new Date(item.created_at).toLocaleString()}</time>
              </div>
            ))}
          </div>
        ) : <div className="p-5"><EmptyState title="No recent activity" description="Company audit events will appear here." icon="📋" /></div>}
      </section>
    </div>
  );
}
