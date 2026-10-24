import { connection } from "next/server";
import AppShell from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth";

export default async function EmployeeLayout({ children }) {
  await connection(); // auth reads cookies — this route renders per-request
  const { profile } = await requireRole("employee");
  return (
    <AppShell role="employee" userName={profile.full_name}>
      {children}
    </AppShell>
  );
}
