import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSetupComplete } from "@/lib/auth";
import SetupWizard from "./wizard";

export const metadata = { title: "First-Run Setup — HCM Lite" };

export default async function SetupPage() {
  await connection(); // setup check queries the database per request
  if (await isSetupComplete()) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to HCM Lite</h1>
        <p className="mt-1 text-sm text-ink-muted">
          First-run setup: verify your access code, configure the company, and create the first
          Admin account. This wizard locks forever once the company exists.
        </p>
      </div>
      <SetupWizard />
    </main>
  );
}
