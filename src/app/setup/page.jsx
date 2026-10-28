import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import SetupWizard from "./wizard";

export const metadata = { title: "Create a Company — HCM Lite" };

export default async function SetupPage() {
  await connection();

  const { user, profile } = await getCurrentProfile();
  if (user && profile?.company_id) redirect(profile.role === "admin" ? "/admin/dashboard" : profile.role === "hr" ? "/hr/dashboard" : "/me/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to HCM Lite</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Configure your company and create its admin account. Each company has its own admin
          and data is kept separate from other companies.
        </p>
      </div>
      <SetupWizard />
    </main>
  );
}
