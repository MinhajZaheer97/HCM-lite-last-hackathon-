import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth";
import ChangePasswordForm from "./change-password-form";

export const metadata = { title: "Change Password — HCM Lite" };

export default async function ChangePasswordPage() {
  await connection(); // session check reads cookies per request
  if (!(await getSessionUser())) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight">Change Password</h1>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
