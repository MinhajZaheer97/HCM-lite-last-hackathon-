"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";
export async function finalizePayroll(runId) {
  const { profile } = await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.from("payroll_runs").update({ status: "finalized", finalized_by: profile.id, finalized_at: new Date().toISOString() }).eq("id", runId).eq("status", "draft").select("id").single();
  if (error) return { error: error.message };
  if (!data) return { error: "Payroll run not found or already finalized" };
  const { data: slips } = await supabase.from("payslips").select("employee_id, payroll_runs(period_month)").eq("run_id", runId);
  const employeeIds = (slips ?? []).map((slip) => slip.employee_id);
  if (employeeIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id").in("employee_id", employeeIds);
    if (profiles?.length) {
      await getAdmin().from("notifications").insert(
        profiles.map((item) => ({
          profile_id: item.id,
          type: "payslip_available",
          title: "Payslip available",
          body: "Your finalized payslip is ready to download.",
          link: "/me/payslips",
        }))
      );
    }
  }
  revalidatePath("/admin/payroll"); revalidatePath("/hr/payroll"); revalidatePath("/me/payslips");
  return { ok: true };
}
