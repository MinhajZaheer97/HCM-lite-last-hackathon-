import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";
export const metadata = { title: "Audit Log — HCM Lite" };
export default async function HrAuditPage() {
  await requireRole(["hr", "admin"]);
  const { data } = await (await createClient()).from("audit_logs").select("id, actor_id, action, entity, entity_id, details, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(200);
  return <><PageHeader title="Audit Log" description="People-process activity visible to HR." /><Card><CardHeader title={`${data?.length ?? 0} recent events`} /><CardBody className="p-0">{!data?.length ? <div className="p-5"><EmptyState title="No audit events" description="Employee, attendance, and leave events will appear here." icon="🔍" /></div> : <Table><THead><tr><TH>When</TH><TH>Actor</TH><TH>Action</TH><TH>Entity</TH><TH>Details</TH></tr></THead><TBody>{data.map((item) => <TR key={item.id}><TD>{new Date(item.created_at).toLocaleString()}</TD><TD>{item.profiles?.full_name ?? "System"}</TD><TD>{item.action}</TD><TD>{item.entity}</TD><TD className="max-w-80 truncate">{JSON.stringify(item.details ?? {})}</TD></TR>)}</TBody></Table>}</CardBody></Card></>;
}
