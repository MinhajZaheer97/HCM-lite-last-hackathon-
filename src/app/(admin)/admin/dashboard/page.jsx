import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { headcount, attendanceSummary, payrollSummary } from "@/lib/analytics/metrics";

export const metadata = { title: "Admin Dashboard — HCM Lite" };

export default async function AdminDashboard({ searchParams }) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : today;
  const supabase = await createClient();
  const [{ data: employees }, { data: records }, { data: runs }, { data: departments }] = await Promise.all([
    supabase.from("employees").select("id, full_name, status, join_date, exit_date, department_id, departments(name)"),
    supabase.from("attendance_records").select("status, work_date").eq("work_date", date),
    supabase.from("payroll_runs").select("status, payslips(gross, net)"),
    supabase.from("departments").select("id, name").order("name"),
  ]);
  const attendance = attendanceSummary(records ?? []);
  const payroll = payrollSummary(runs ?? []);
  const departmentsById = new Map((departments ?? []).map((department) => [department.id, department.name]));
  const deptCounts = (employees ?? []).reduce((map, employee) => {
    const name = departmentsById.get(employee.department_id) ?? "Unassigned";
    map.set(name, (map.get(name) ?? 0) + (["active", "probation"].includes(employee.status) ? 1 : 0));
    return map;
  }, new Map());
  return (
    <>
      <PageHeader title="Admin Dashboard" description={`Company metrics for ${date}.`} />
      <form className="mb-4 flex items-end gap-2" action="/admin/dashboard">
        <label className="text-sm">Date<input className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm" type="date" name="date" defaultValue={date} /></label>
        <button className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:bg-surface-muted" type="submit">Apply</button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Headcount", headcount(employees ?? [], date)],
          ["Attendance rate", `${attendance.attendanceRate}%`],
          ["Payroll cost", payroll.gross.toFixed(2)],
          ["Avg salary", payroll.averageSalary.toFixed(2)],
        ].map(([label, value]) => <Card key={label}><CardBody><p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></CardBody></Card>)}
      </div>
      <Card className="mt-4"><CardHeader title="Headcount by department" /><CardBody>{deptCounts.size ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[...deptCounts].map(([name, count]) => <div key={name} className="rounded-lg border border-border p-3"><p className="text-sm text-ink-muted">{name}</p><p className="mt-1 text-xl font-semibold">{count}</p></div>)}</div> : <EmptyState title="No employee data" description="Metrics will appear after employees are registered." icon="📊" />}</CardBody></Card>
    </>
  );
}
