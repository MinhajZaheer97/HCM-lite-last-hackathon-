import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import AnnouncementForm from "./announcement-form";
export const metadata = { title: "Announcements — HCM Lite" };
export default async function HrAnnouncementsPage() {
  await requireRole(["admin", "hr"]);
  const { data } = await (await createClient()).from("announcements").select("id, title, body, created_at, profiles(full_name)").order("created_at", { ascending: false });
  return <><PageHeader title="Announcements" description="Post announcements visible to all users." /><Card className="mb-4"><CardHeader title="New announcement" /><CardBody><AnnouncementForm /></CardBody></Card><Card><CardHeader title="Published announcements" /><CardBody className="space-y-3">{!data?.length ? <EmptyState title="No announcements" description="Post the first company update." icon="📢" /> : data.map((item) => <article key={item.id} className="rounded-lg border border-border p-4"><h3 className="font-medium">{item.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{item.body}</p><p className="mt-3 text-xs text-ink-muted">{new Date(item.created_at).toLocaleString()} · {item.profiles?.full_name ?? "Staff"}</p></article>)}</CardBody></Card></>;
}
