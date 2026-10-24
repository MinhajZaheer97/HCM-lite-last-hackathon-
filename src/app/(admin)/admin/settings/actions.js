"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(values) {
  await requireRole("admin");

  const name = String(values?.name ?? "").trim();
  if (!name) return { error: "Company name is required" };
  if (!values?.office_start || !values?.office_end)
    return { error: "Office hours are required" };
  if (values.office_start >= values.office_end)
    return { error: "Office start must be before office end" };

  const grace = Number(values.grace_minutes);
  if (!Number.isInteger(grace) || grace < 0 || grace > 120)
    return { error: "Grace minutes must be 0–120" };

  const weekend = (Array.isArray(values.weekend_days) ? values.weekend_days : [])
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (!weekend.length) return { error: "Select at least one weekend day" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name,
      address: String(values.address ?? "").trim() || null,
      office_location: String(values.office_location ?? "").trim() || null,
      timezone: values.timezone || "Asia/Karachi",
      currency: values.currency || "PKR",
      office_start: values.office_start,
      office_end: values.office_end,
      grace_minutes: grace,
      weekend_days: weekend,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
