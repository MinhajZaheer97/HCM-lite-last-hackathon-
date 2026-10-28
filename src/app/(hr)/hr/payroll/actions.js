"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/attendance/context";
import { listWorkingDates } from "@/lib/leave/rules";
import { calculatePayslip } from "@/lib/payroll/calculate";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveSalary({ employeeId, basic, allowances, effectiveFrom }) {
  const { profile } = await requireRole(["hr", "admin"]);
  const companyId = profile.company_id;
  const amount = Number(basic);
  if (!employeeId || !Number.isFinite(amount) || amount < 0) return { error: "Enter a valid basic salary" };
  if (!DATE_RE.test(effectiveFrom)) return { error: "Effective date is required" };
  const parsedAllowances = {};
  for (const item of String(allowances ?? "").split(",").map((value) => value.trim()).filter(Boolean)) {
    const [label, value] = item.split(":");
    const numeric = Number(value);
    if (!label?.trim() || !Number.isFinite(numeric) || numeric < 0) return { error: "Allowances must use Label:Amount, comma-separated" };
    parsedAllowances[label.trim()] = numeric;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("salary_structures").upsert({
    employee_id: employeeId,
    company_id: companyId,
    basic: amount,
    allowances: parsedAllowances,
    effective_from: effectiveFrom,
    updated_by: profile.id,
  }, { onConflict: "employee_id" });
  if (error) return { error: error.message };
  revalidatePath("/hr/payroll");
  return { ok: true };
}

function monthDates(periodMonth, weekendDays, holidays) {
  const year = Number(periodMonth.slice(0, 4));
  const month = Number(periodMonth.slice(5, 7));
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return listWorkingDates(`${periodMonth}-01`, end, { weekendDays, holidays });
}

export async function createDraft(periodMonth) {
  const { profile } = await requireRole(["hr", "admin"]);
  if (!/^\d{4}-\d{2}$/.test(periodMonth)) return { error: "Choose a valid month" };
  const supabase = await createClient();
  const { company, holidays } = await getCompanyContext();
  const companyId = profile.company_id;
  const periodDate = `${periodMonth}-01`;
  const monthEnd = new Date(Date.UTC(Number(periodMonth.slice(0, 4)), Number(periodMonth.slice(5, 7)), 0))
    .toISOString()
    .slice(0, 10);
  const { data: existingRun } = await supabase
    .from("payroll_runs")
    .select("id, status")
    .eq("company_id", companyId)
    .eq("period_month", periodDate)
    .maybeSingle();
  if (existingRun?.status === "finalized") return { error: "This payroll run is finalized" };
  const dates = monthDates(periodMonth, company?.weekend_days ?? [0, 6], holidays);
  const { data: run, error: runError } = await supabase.from("payroll_runs").upsert({
    company_id: companyId, period_month: periodDate, status: "draft", drafted_by: profile.id,
  }, { onConflict: "company_id,period_month" }).select("id, status").single();
  if (runError) return { error: runError.message };
  if (run.status === "finalized") return { error: "This payroll run is finalized" };
  const [
    { data: employees, error: employeesError },
    { data: salaries, error: salariesError },
    { data: attendance, error: attendanceError },
    { data: leaves, error: leavesError },
  ] = await Promise.all([
    supabase.from("employees").select("id, full_name, join_date, exit_date").in("status", ["active", "probation"]),
    supabase.from("salary_structures").select("employee_id, basic, allowances, effective_from").lte("effective_from", monthEnd),
    supabase.from("attendance_records").select("employee_id, work_date, status").gte("work_date", `${periodMonth}-01`).lte("work_date", monthEnd),
    supabase.from("leave_requests").select("employee_id, start_date, end_date, days, status, is_half_day, leave_types(is_paid)").eq("status", "approved").lte("start_date", monthEnd).gte("end_date", `${periodMonth}-01`),
  ]);
  const queryError = [employeesError, salariesError, attendanceError, leavesError].find(Boolean);
  if (queryError) return { error: queryError.message };
  const salaryByEmployee = new Map(
    (salaries ?? []).map((row) => [row.employee_id, row]),
  );
  const attendanceByEmployee = new Map();
  for (const row of attendance ?? []) {
    if (!attendanceByEmployee.has(row.employee_id)) attendanceByEmployee.set(row.employee_id, []);
    attendanceByEmployee.get(row.employee_id).push(row);
  }
  const leaveByEmployee = new Map();
  for (const row of leaves ?? []) {
    if (!leaveByEmployee.has(row.employee_id)) leaveByEmployee.set(row.employee_id, []);
    leaveByEmployee.get(row.employee_id).push(row);
  }
  const slips = [];
  for (const employee of employees ?? []) {
    const salary = salaryByEmployee.get(employee.id);
    if (!salary) continue;
    const eligibleDates = dates.filter((date) => date >= employee.join_date && (!employee.exit_date || date <= employee.exit_date));
    const records = attendanceByEmployee.get(employee.id) ?? [];
    const recordByDate = new Map(records.map((record) => [record.work_date, record]));
    let absentDays = 0; let halfDays = 0;
    for (const date of eligibleDates) {
      const record = recordByDate.get(date);
      if (!record) absentDays += 1;
      else if (record.status === "half_day") halfDays += 1;
    }
    let unpaidLeaveDays = 0;
    for (const leave of leaveByEmployee.get(employee.id) ?? []) {
      if (leave.leave_types?.is_paid === false) {
        const start = leave.start_date > `${periodMonth}-01` ? leave.start_date : `${periodMonth}-01`;
        const end = leave.end_date < monthEnd ? leave.end_date : monthEnd;
        unpaidLeaveDays += listWorkingDates(start, end, { weekendDays: company?.weekend_days ?? [0, 6], holidays }).length;
      }
    }
    const result = calculatePayslip({
      ...salary,
      workingDays: eligibleDates.length,
      absentDays,
      unpaidLeaveDays,
      halfDays,
    });
    slips.push({
      company_id: companyId,
      run_id: run.id,
      employee_id: employee.id,
      gross: result.gross,
      total_deductions: result.totalDeductions,
      net: result.net,
      days_worked: result.daysWorked,
      lop_days: result.lopDays,
      deduction_items: result.deductionItems,
    });
  }
  if (slips.length) {
    const { error } = await supabase.from("payslips").upsert(slips, { onConflict: "run_id,employee_id" });
    if (error) return { error: error.message };
  }
  revalidatePath("/hr/payroll"); revalidatePath("/admin/payroll");
  return {
    ok: true,
    runId: run.id,
    count: slips.length,
    skipped: (employees ?? []).length - slips.length,
  };
}
