import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";
import DecisionButton from "./decision-button";

export const metadata = { title: "Leave Requests — HCM Lite" };

export default async function HrLeavePage() {
  await requireRole(["hr", "admin"]);
  const supabase = await createClient();
  const { data: requests } = await supabase.from("leave_requests").select("id, employee_id, start_date, end_date, days, reason, status, created_at, employees(full_name, emp_code), leave_types(name, is_paid)").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader title="Leave Requests" description="Review, approve, or reject leave requests." />
      <Card><CardHeader title={`Requests (${requests?.length ?? 0})`} /><CardBody className="p-0">
        {!requests?.length ? <div className="p-5"><EmptyState title="No leave requests" description="Employee requests will appear here." icon="🌴" /></div> : <Table><THead><tr><TH>Employee</TH><TH>Type</TH><TH>Dates</TH><TH>Days</TH><TH>Reason</TH><TH>Status</TH><TH className="text-right">Action</TH></tr></THead><TBody>{requests.map((request) => <TR key={request.id}><TD><span className="font-medium">{request.employees?.full_name}</span><span className="block text-xs text-ink-muted">{request.employees?.emp_code}</span></TD><TD>{request.leave_types?.name}</TD><TD>{request.start_date} → {request.end_date}</TD><TD>{request.days}</TD><TD className="max-w-56 truncate">{request.reason}</TD><TD><Badge tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : request.status === "pending" ? "warning" : "neutral"}>{request.status}</Badge></TD><TD className="text-right">{request.status === "pending" && <DecisionButton requestId={request.id} employeeName={request.employees?.full_name} />}</TD></TR>)}</TBody></Table>}
      </CardBody></Card>
    </>
  );
}
