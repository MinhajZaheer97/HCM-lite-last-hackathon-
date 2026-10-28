import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile, isSetupComplete } from "@/lib/auth";
import LoginForm from "./login-form";

export const metadata = { title: "Log in — HCM Lite" };

export default async function LoginPage() {
  await connection();
  if (!(await isSetupComplete())) redirect("/setup");

  const { user, profile } = await getCurrentProfile();
  if (user && profile?.company_id) {
    redirect(profile.role === "admin" ? "/admin/dashboard" : profile.role === "hr" ? "/hr/dashboard" : "/me/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">HCM Lite</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your workspace</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
