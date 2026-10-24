import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
export async function GET(request, { params }) {
  const { profile } = await getCurrentProfile();
  if (!profile) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const supabase = await createClient();
  const { data: slip } = await supabase.from("payslips").select("id, gross, total_deductions, net, days_worked, lop_days, deduction_items, employees(full_name, emp_code), payroll_runs(period_month, status)").eq("id", id).single();
  if (!slip || slip.payroll_runs?.status !== "finalized") return new Response("Payslip not found", { status: 404 });
  const doc = await PDFDocument.create(); const page = doc.addPage([595, 842]); const font = await doc.embedFont(StandardFonts.Helvetica); const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawText("HCM Lite — Payslip", { x: 50, y: 780, size: 20, font: bold, color: rgb(0.1, 0.2, 0.4) });
  const lines = [["Employee", `${slip.employees?.full_name} (${slip.employees?.emp_code})`], ["Period", slip.payroll_runs.period_month.slice(0, 7)], ["Gross", Number(slip.gross).toFixed(2)], ["Deductions", Number(slip.total_deductions).toFixed(2)], ["Net pay", Number(slip.net).toFixed(2)], ["Days worked", String(slip.days_worked)], ["Loss of pay days", String(slip.lop_days)]];
  lines.forEach(([label, value], index) => { const y = 730 - index *  thirty; page.drawText(label, { x: 60, y, size: 11, font: bold }); page.drawText(value, { x: 220, y, size: 11, font }); });
  const bytes = await doc.save();
  return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="payslip-${slip.payroll_runs.period_month.slice(0, 7)}.pdf"` } });
}
const thirty = 30;
