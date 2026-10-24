import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
export const metadata = { title: "Announcements — HCM Lite" };
export default async function MyAnnouncementsPage() {
  await requireRole("employee");
  const { data } = await (await createClient()).from("announcements").select("id, title, body, created_at, profiles(full_name)").order("created_at", { ascending: false });
  return <><PageHeader title="Announcements" description="Company announcements from Admin and HR." /><Card><CardHeader title="Company updates" /><CardBody className="space-y-3">{!data?.length ? <EmptyState title="No announcements" description="Company updates will appear here." icon="📢" /> : data.map((item) => <article key={item.id} className="rounded-lg border border-border p-4"><h3 className="font-medium">{item.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{item.body}</p><p className="mt-3 text-xs text-ink-muted">{new Date(item.created_at).toLocaleString()} · {item.profiles?.full_name ?? "Staff"}</p></article>)}</CardBody></Card></>;
}
