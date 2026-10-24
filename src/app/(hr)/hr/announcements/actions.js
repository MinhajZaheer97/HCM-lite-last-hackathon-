"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export async function postAnnouncement({ title, body }) {
  try {
    const { profile } = await requireRole(["admin", "hr"]);
    const cleanTitle = String(title ?? "").trim();
    const cleanBody = String(body ?? "").trim();
    if (!cleanTitle || !cleanBody) return { error: "Title and message are required" };
    const { error } = await (await createClient()).from("announcements").insert({
      title: cleanTitle,
      body: cleanBody,
      posted_by: profile.id,
    });
    if (error) return { error: error.message };
    revalidatePath("/hr/announcements");
    revalidatePath("/admin/announcements");
    revalidatePath("/me/announcements");
    return { ok: true };
  } catch (error) {
    console.error("postAnnouncement failed", error);
    return { error: error instanceof Error ? error.message : "Unable to post announcement" };
  }
}
