"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCompanyId, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveDepartment(row) {
  await requireRole("admin");
  const companyId = await getCurrentCompanyId();
  if (companyId === null) return { error: "Your account is not assigned to a company" };

  const name = String(row?.name ?? "").trim();
  if (!name) return { error: "Department name is required" };

  const supabase = await createClient();
  const payload = { name, company_id: companyId };
  const { error } = row.id
    ? await supabase.from("departments").update(payload).eq("id", row.id)
    : await supabase.from("departments").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function deleteDepartment(id) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503"
        ? "This department is referenced by employees or designations. Reassign them first."
        : error.message,
    };
  }
  revalidatePath("/admin/departments");
  return { ok: true };
}
