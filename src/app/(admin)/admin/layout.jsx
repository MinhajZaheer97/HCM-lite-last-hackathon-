import { connection } from "next/server";
import AppShell from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }) {
  await connection(); // auth reads cookies — this route renders per-request
  const { profile } = await requireRole("admin");
  return (
    <AppShell role="admin" userName={profile.full_name}>
      {children}
    </AppShell>
  );
}
