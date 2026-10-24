import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";
import LeaveForm from "./leave-form";
import CancelButton from "./cancel-button";

export const metadata = { title: "My Leave — HCM Lite" };

export default async function MyLeavePage() {
  const { profile } = await requireRole("employee");
  const supabase = await createClient();
  const [{ data: types }, { data: requests }] = await Promise.all([
    supabase.from("leave_types").select("id, name, annual_days, is_paid").order("name"),
    supabase.from("leave_requests").select("id, leave_type_id, start_date, end_date, days, is_half_day, reason, status, decision_comment, leave_types(name, annual_days)").eq("employee_id", profile.employee_id).order("created_at", { ascending: false }),
  ]);
  const usedByType = {};
  for (const request of requests ?? []) {
    if (["pending", "approved"].includes(request.status)) usedByType[request.leave_type_id] = (usedByType[request.leave_type_id] ?? 0) + Number(request.days);
  }
  return (
    <>
      <PageHeader title="My Leave" description="Apply for leave, view balances and request history." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card><CardHeader title="Apply for leave" /><CardBody><LeaveForm leaveTypes={types ?? []} /></CardBody></Card>
        <Card><CardHeader title="Leave balances" /><CardBody className="grid gap-2 sm:grid-cols-2">
          {(types ?? []).map((type) => <div key={type.id} className="rounded-lg border border-border p-3"><p className="text-sm font-medium">{type.name}</p><p className="mt-1 text-2xl font-semibold">{Math.max(0, Number(type.annual_days) - (usedByType[type.id] ?? 0))}</p><p className="text-xs text-ink-muted">of {type.annual_days} days remaining</p></div>)}
          {!types?.length && <EmptyState title="No leave types configured" description="Ask an administrator to configure leave types." icon="🌴" />}
        </CardBody></Card>
      </div>
      <Card className="mt-4"><CardHeader title="Request history" /><CardBody className="p-0">
        {!requests?.length ? <div className="p-5"><EmptyState title="No leave requests" description="Your requests will appear here." icon="📅" /></div> : <Table><THead><tr><TH>Type</TH><TH>Dates</TH><TH>Days</TH><TH>Reason</TH><TH>Status</TH><TH /></tr></THead><TBody>{requests.map((request) => <TR key={request.id}><TD>{request.leave_types?.name}</TD><TD>{request.start_date} → {request.end_date}</TD><TD>{request.days}</TD><TD className="max-w-56 truncate">{request.reason}</TD><TD><Badge tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : request.status === "pending" ? "warning" : "neutral"}>{request.status}</Badge>{request.decision_comment && <p className="text-xs text-ink-muted">{request.decision_comment}</p>}</TD><TD className="text-right">{request.status === "pending" && <CancelButton requestId={request.id} />}</TD></TR>)}</TBody></Table>}
      </CardBody></Card>
    </>
  );
}
