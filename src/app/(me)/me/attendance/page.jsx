import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getCompanyContext } from "@/lib/attendance/context";
import { zonedParts } from "@/lib/dates/tz";
import { dayType, effectiveStatus } from "@/lib/attendance/rules";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import { PunchCard, CorrectButton } from "./punch";

export const metadata = { title: "My Attendance — HCM Lite" };

const STATUS_TONE = {
  present: "success",
  late: "warning",
  half_day: "warning",
  missing_checkout: "danger",
  absent: "danger",
  on_leave: "brand",
};

function fmtTime(iso, tz) {
  if (!iso) return "—";
  return zonedParts(new Date(iso), tz).time;
}

export default async function MyAttendancePage({ searchParams }) {
  const { profile } = await requireRole("employee");
  const params = await searchParams;
  const now = new Date();

  const supabase = await createClient();
  const { company, holidays } = await getCompanyContext();
  const tz = company?.timezone ?? "Asia/Karachi";
  const today = zonedParts(now, tz).dateISO;

  // Month being viewed (defaults to current month).
  const year = Number(params.y) || today.slice(0, 4);
  const month = Number(params.m) || today.slice(5, 7);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  const { data: records } = await supabase
    .from("attendance_records")
    .select("id, work_date, check_in, check_out, status, worked_minutes")
    .eq("employee_id", profile.employee_id)
    .gte("work_date", monthStart)
    .lte("work_date", monthEnd)
    .order("work_date", { ascending: false });

  const recs = records ?? [];
  const byDate = new Map(recs.map((r) => [r.work_date, r]));

  const todayRecord = byDate.get(today);
  const canCheckIn = !todayRecord;
  const canCheckOut = todayRecord?.check_in && !todayRecord?.check_out;
  const todayType = dayType(today, { weekendDays: company?.weekend_days ?? [0, 6], holidays });

  // ── Month calendar grid ──
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(`${monthStart}T12:00:00Z`).getUTCDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const rec = byDate.get(dateISO);
    let label = null;
    if (rec) label = effectiveStatus(rec, today);
    else if (dateISO <= today) {
      const type = dayType(dateISO, { weekendDays: company?.weekend_days ?? [0, 6], holidays });
      label = type === "workday" && dateISO <= today ? "absent" : type;
    } else {
      label = dayType(dateISO, { weekendDays: company?.weekend_days ?? [0, 6], holidays });
    }
    cells.push({ dateISO, day: d, label, future: dateISO > today });
  }

  const cellTone = {
    present: "bg-success-50 text-success-700 border-success-600/30",
    late: "bg-warning-50 text-warning-700 border-warning-600/30",
    half_day: "bg-warning-50 text-warning-700 border-warning-600/30",
    missing_checkout: "bg-danger-50 text-danger-700 border-danger-600/30",
    absent: "bg-danger-50 text-danger-700 border-danger-600/30",
    on_leave: "bg-brand-50 text-brand-700 border-brand-200",
    weekend: "bg-surface-muted text-ink-muted border-border",
    holiday: "bg-brand-50 text-brand-700 border-brand-200",
  };

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <>
      <PageHeader
        title="My Attendance"
        description={`All times in ${tz.replace("_", " ")} (company timezone).`}
      />

      <Card className="mb-4">
        <CardHeader title="Today" subtitle={`${today}${todayType !== "workday" ? ` · ${todayType}` : ""}`} />
        <CardBody>
          <PunchCard
            state={{
              canCheckIn,
              canCheckOut,
              checkIn: todayRecord ? fmtTime(todayRecord.check_in, tz) : null,
              checkOut: todayRecord ? fmtTime(todayRecord.check_out, tz) : null,
              status: todayRecord ? effectiveStatus(todayRecord, today) : null,
            }}
          />
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader
          title={`${new Date(`${monthStart}T12:00:00Z`).toLocaleDateString("en", { month: "long", year: "numeric" })}`}
          actions={
            <div className="flex gap-2 text-sm">
              <a className="text-brand-700 hover:underline" href={`/me/attendance?y=${prev.y}&m=${prev.m}`}>← Prev</a>
              <a className="text-brand-700 hover:underline" href="/me/attendance">Today</a>
              <a className="text-brand-700 hover:underline" href={`/me/attendance?y=${next.y}&m=${next.m}`}>Next →</a>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="pb-1 font-medium text-ink-muted">{d}</div>
            ))}
            {cells.map((cell, i) =>
              cell === null ? (
                <div key={`e${i}`} />
              ) : (
                <div
                  key={cell.dateISO}
                  title={cell.label}
                  className={`rounded-lg border p-1.5 ${cellTone[cell.label] ?? "border-border"} ${
                    cell.future ? "opacity-40" : ""
                  }`}
                >
                  <div className="font-medium">{cell.day}</div>
                  <div className="text-[10px] capitalize leading-tight">{cell.label?.replaceAll("_", " ")}</div>
                </div>
              )
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {["present", "late", "half_day", "missing_checkout", "absent", "on_leave", "holiday", "weekend"].map((s) => (
              <Badge key={s} tone={STATUS_TONE[s] ?? "neutral"}>{s.replaceAll("_", " ")}</Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="History & corrections" subtitle="This month's records — newest first." />
        <CardBody className="p-0">
          {recs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No attendance this month"
                description="Your check-ins and check-outs will appear here."
                icon="📅"
              />
            </div>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Date</TH>
                  <TH>Check in</TH>
                  <TH>Check out</TH>
                  <TH>Worked</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Correction</TH>
                </tr>
              </THead>
              <TBody>
                {recs.map((r) => (
                  <TR key={r.id}>
                    <TD>{r.work_date}</TD>
                    <TD>{fmtTime(r.check_in, tz)}</TD>
                    <TD>{fmtTime(r.check_out, tz)}</TD>
                    <TD>{r.worked_minutes != null ? `${Math.floor(r.worked_minutes / 60)}h ${r.worked_minutes % 60}m` : "—"}</TD>
                    <TD><Badge tone={STATUS_TONE[effectiveStatus(r, today)]}>{effectiveStatus(r, today).replaceAll("_", " ")}</Badge></TD>
                    <TD className="text-right">
                      <CorrectButton recordId={r.id} recordDate={r.work_date} />
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
