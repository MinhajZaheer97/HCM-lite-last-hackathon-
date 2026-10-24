"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(prevState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated" };
  }

  redirect(
    profile.role === "admin" ? "/admin/dashboard" : profile.role === "hr" ? "/hr/dashboard" : "/me/dashboard"
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePassword(prevState, formData) {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters" };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Not signed in" };

  // Verify the current password before replacing it.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: data.user.email,
    password: current,
  });
  if (verifyError) return { error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: error.message };
  return { success: "Password updated" };
}
