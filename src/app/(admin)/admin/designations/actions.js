"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveDesignation(row) {
  await requireRole("admin");
  const name = String(row?.name ?? "").trim();
  if (!name) return { error: "Designation name is required" };

  const payload = {
    name,
    department_id: row.department_id ? Number(row.department_id) : null,
  };

  const supabase = await createClient();
  const { error } = row.id
    ? await supabase.from("designations").update(payload).eq("id", row.id)
    : await supabase.from("designations").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/designations");
  return { ok: true };
}

export async function deleteDesignation(id) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("designations").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503"
        ? "This designation is assigned to employees. Reassign them first."
        : error.message,
    };
  }
  revalidatePath("/admin/designations");
  return { ok: true };
}
