import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getCompanyContext } from "@/lib/attendance/context";
import { zonedParts } from "@/lib/dates/tz";
import { dayType, effectiveStatus } from "@/lib/attendance/rules";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import ReviewCorrectionButton from "./review";

export const metadata = { title: "Attendance — HCM Lite" };

const STATUS_TONE = {
  present: "success",
  late: "warning",
  half_day: "warning",
  missing_checkout: "danger",
  absent: "danger",
  on_leave: "brand",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function HrAttendancePage({ searchParams }) {
  await requireRole(["hr", "admin"]);
  const params = await searchParams;

  const supabase = await createClient();
  const { company, holidays } = await getCompanyContext();
  const tz = company?.timezone ?? "Asia/Karachi";
  const today = zonedParts(new Date(), tz).dateISO;
  const date = DATE_RE.test(String(params.date ?? "")) ? params.date : today;

  const type = dayType(date, { weekendDays: company?.weekend_days ?? [0, 6], holidays });

  // Eligible employees: employed on this date (not exited before it, joined
  // on or before it).
  const { data: employees } = await supabase
    .from("employees")
    .select("id, emp_code, full_name, departments(name)")
    .neq("status", "exited")
    .lte("join_date", date)
    .order("full_name");

  const { data: records } = await supabase
    .from("attendance_records")
    .select("id, employee_id, check_in, check_out, status, worked_minutes")
    .eq("work_date", date);

  const byEmployee = new Map((records ?? []).map((r) => [r.employee_id, r]));

  const rows = (employees ?? []).map((e) => {
    const rec = byEmployee.get(e.id);
    const status = rec
      ? effectiveStatus(rec, today)
      : type === "workday"
        ? "absent"
        : type;
    return {
      ...e,
      record: rec,
      status,
      checkIn: rec?.check_in ? zonedParts(new Date(rec.check_in), tz).time : "—",
      checkOut: rec?.check_out ? zonedParts(new Date(rec.check_out), tz).time : "—",
      worked:
        rec?.worked_minutes != null
          ? `${Math.floor(rec.worked_minutes / 60)}h ${rec.worked_minutes % 60}m`
          : "—",
    };
  });

  const counts = {};
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;

  // Pending corrections queue.
  const { data: corrections } = await supabase
    .from("attendance_corrections")
    .select(
      `id, requested, reason, requested_at, status,
       employees(full_name), attendance_records(work_date)`
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  const pending = corrections ?? [];

  return (
    <>
      <PageHeader
        title="Attendance Board"
        description={`Daily view for ${date} · ${type} · times in ${tz.replace("_", " ")}`}
      />

      <form className="mb-4 flex items-end gap-2" action="/hr/attendance">
        <input
          type="date"
          name="date"
          defaultValue={date}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          View
        </button>
        <a href="/hr/attendance" className="px-2 py-2 text-sm text-brand-700 hover:underline">
          Today
        </a>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {["present", "late", "half_day", "missing_checkout", "absent", "on_leave"].map((s) => (
          <Badge key={s} tone={STATUS_TONE[s]}>
            {s.replaceAll("_", " ")}: {counts[s] ?? 0}
          </Badge>
        ))}
      </div>

      <Card className="mb-4">
        <CardHeader title={`Employees (${rows.length})`} subtitle={type !== "workday" ? `${type} — no attendance expected` : undefined} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No eligible employees"
                description="Employees registered with a join date on or before this day will appear here."
                icon="👥"
              />
            </div>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Code</TH>
                  <TH>Name</TH>
                  <TH>Department</TH>
                  <TH>Check in</TH>
                  <TH>Check out</TH>
                  <TH>Worked</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r.id}>
                    <TD>{r.emp_code}</TD>
                    <TD className="font-medium">{r.full_name}</TD>
                    <TD>{r.departments?.name ?? "—"}</TD>
                    <TD>{r.checkIn}</TD>
                    <TD>{r.checkOut}</TD>
                    <TD>{r.worked}</TD>
                    <TD>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status.replaceAll("_", " ")}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Correction requests" subtitle="Employee-submitted attendance corrections awaiting review." />
        <CardBody className="p-0">
          {pending.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No pending corrections" description="Requests appear here as employees submit them." icon="✅" />
            </div>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Employee</TH>
                  <TH>Date</TH>
                  <TH>Proposed</TH>
                  <TH>Reason</TH>
                  <TH className="text-right">Action</TH>
                </tr>
              </THead>
              <TBody>
                {pending.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.employees?.full_name}</TD>
                    <TD>{c.attendance_records?.work_date}</TD>
                    <TD>
                      {[
                        c.requested?.check_in && `in ${c.requested.check_in}`,
                        c.requested?.check_out && `out ${c.requested.check_out}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </TD>
                    <TD className="max-w-56 truncate">{c.reason}</TD>
                    <TD className="text-right">
                      <ReviewCorrectionButton
                        correctionId={c.id}
                        employeeName={c.employees?.full_name}
                        requested={c.requested}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
