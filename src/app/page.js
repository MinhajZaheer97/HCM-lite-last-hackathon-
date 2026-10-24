import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentProfile, isSetupComplete, roleHome } from "@/lib/auth";

// Boot router: /setup when unconfigured, /login when signed out, the
// signed-in user's role dashboard otherwise. `connection()` marks this
// route dynamic (request-time data) under cacheComponents.
export default async function Home() {
  await connection();

  if (!(await isSetupComplete())) redirect("/setup");
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile) redirect("/login");

  redirect(roleHome[profile.role] ?? "/login");
}
