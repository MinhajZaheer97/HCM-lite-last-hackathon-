import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile, isSetupComplete, roleHome } from "@/lib/auth";
import LandingPage from "@/components/landing/LandingPage";

export const metadata = {
  title: "HCM Lite — Human Capital Management",
  description: "Manage attendance, leave, payroll, employees, and HR operations with HCM Lite.",
};

// Public landing page for signed-out visitors. Preserve setup and signed-in routing.
export default async function Home() {
  await connection();

  if (!(await isSetupComplete())) redirect("/setup");
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile) return <LandingPage />;
  if (!profile.company_id) redirect("/setup");

  redirect(roleHome[profile.role] ?? "/login");
}
