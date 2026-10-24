import { createClient } from "@/lib/supabase/server";
export async function GET() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return Response.json({ notifications: [] }, { status: 401 });
  const { data, error } = await supabase.from("notifications").select("id, type, title, body, link, read_at, created_at").order("created_at", { ascending: false }).limit(8);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ notifications: data ?? [] });
}
export async function PATCH(request) {
  const body = await request.json();
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user || !body.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
