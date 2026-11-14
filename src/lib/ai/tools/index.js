import { AI_LIMITS, boundedDateRange } from "@/lib/ai/config";
import { attendanceSummary, headcount, payrollSummary } from "@/lib/analytics/metrics";

function assertRole(profile, roles) {
  if (!profile?.is_active || !roles.includes(profile.role)) throw new Error("This information is not available for your role");
}

function cleanRows(rows) {
  return (rows ?? []).slice(0, AI_LIMITS.maxToolRows);
}

async function companyPolicy({ db }) {
  const [{ data: company, error: companyError }, { data: holidays, error: holidayError }] = await Promise.all([
    db.from("companies").select("name, timezone, currency, office_start, office_end, grace_minutes, weekend_days").single(),
    db.from("holidays").select("holiday_date, name").order("holiday_date", { ascending: false }).limit(20),
  ]);
  if (companyError) throw companyError;
  if (holidayError) throw holidayError;
  return { company, upcoming_holidays: cleanRows(holidays) };
}

async function workforceSummary({ db, profile }) {
  assertRole(profile, ["admin", "hr"]);
  const [{ data: employees, error }, { data: departments, error: departmentError }] = await Promise.all([
    db.from("employees").select("status, department_id"),
    db.from("departments").select("id, name"),
  ]);
  if (error) throw error;
  if (departmentError) throw departmentError;
  const names = new Map((departments ?? []).map((department) => [department.id, department.name]));
  const byDepartment = {};
  for (const employee of employees ?? []) {
    if (!["active", "probation"].includes(employee.status)) continue;
    const name = names.get(employee.department_id) || "Unassigned";
    byDepartment[name] = (byDepartment[name] || 0) + 1;
  }
  return { headcount: headcount(employees ?? []), by_department: byDepartment };
}

async function attendance({ db, profile, args }) {
  const { start, end } = boundedDateRange(args);
  const query = db.from("attendance_records").select("status, work_date, employee_id").gte("work_date", start).lte("work_date", end).order("work_date");
  if (profile.role === "employee") query.eq("employee_id", profile.employee_id);
  else assertRole(profile, ["admin", "hr"]);
  const { data, error } = await query.limit(AI_LIMITS.maxToolRows);
  if (error) throw error;
  return { period: { start, end }, summary: attendanceSummary(data ?? []), records_count: data?.length ?? 0 };
}

async function leave({ db, profile, args }) {
  const { start, end } = boundedDateRange(args, 365);
  const query = db.from("leave_requests").select("start_date, end_date, days, status, leave_type_id, employee_id, leave_types(name)").lte("start_date", end).gte("end_date", start).order("start_date", { ascending: false });
  if (profile.role === "employee") query.eq("employee_id", profile.employee_id);
  else assertRole(profile, ["admin", "hr"]);
  const { data, error } = await query.limit(AI_LIMITS.maxToolRows);
  if (error) throw error;
  const counts = (data ?? []).reduce((result, item) => {
    result[item.status] = (result[item.status] || 0) + Number(item.days || 0);
    return result;
  }, {});
  return { period: { start, end }, days_by_status: counts, request_count: data?.length ?? 0 };
}

async function payroll({ db, profile, args }) {
  assertRole(profile, ["admin", "hr", "employee"]);
  const query = db.from("payslips").select("gross, total_deductions, net, employee_id, payroll_runs!inner(period_month, status)").eq("payroll_runs.status", "finalized").order("id", { ascending: false });
  if (profile.role === "employee") query.eq("employee_id", profile.employee_id);
  if (args?.period_month && isMonth(args.period_month)) query.eq("payroll_runs.period_month", `${args.period_month}-01`);
  const { data, error } = await query.limit(AI_LIMITS.maxToolRows);
  if (error) throw error;
  return payrollSummary((data ?? []).reduce((runs, slip) => {
    const run = runs.find((item) => item.period_month === slip.payroll_runs.period_month);
    if (run) run.payslips.push(slip);
    else runs.push({ period_month: slip.payroll_runs.period_month, status: "finalized", payslips: [slip] });
    return runs;
  }, []));
}

function isMonth(value) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

export const TOOL_DEFINITIONS = {
  company_policy: {
    description: "Get working hours, timezone, currency, grace period, and recent holidays.",
    parameters: { type: "object", properties: {} },
    roles: ["admin", "hr", "employee"],
    run: companyPolicy,
  },
  workforce_summary: {
    description: "Get active and probation headcount by department. Admin and HR only.",
    parameters: { type: "object", properties: {} },
    roles: ["admin", "hr"],
    run: workforceSummary,
  },
  attendance_summary: {
    description: "Get attendance rates for a date range. Employees receive only their own records.",
    parameters: { type: "object", properties: { start_date: { type: "string" }, end_date: { type: "string" } } },
    roles: ["admin", "hr", "employee"],
    run: attendance,
  },
  leave_summary: {
    description: "Get leave request totals for a date range. Employees receive only their own records.",
    parameters: { type: "object", properties: { start_date: { type: "string" }, end_date: { type: "string" } } },
    roles: ["admin", "hr", "employee"],
    run: leave,
  },
  finalized_payroll: {
    description: "Get finalized payroll totals. Employees receive only their own finalized payslips.",
    parameters: { type: "object", properties: { period_month: { type: "string", description: "Optional YYYY-MM period" } } },
    roles: ["admin", "hr", "employee"],
    run: payroll,
  },
};

export async function executeTool(name, args, context) {
  const tool = TOOL_DEFINITIONS[name];
  if (!tool || !tool.roles.includes(context.profile.role)) throw new Error("That information is not available for your role");
  return tool.run({ ...context, args: args ?? {} });
}

export function toolsForRole(role) {
  return Object.entries(TOOL_DEFINITIONS)
    .filter(([, tool]) => tool.roles.includes(role))
    .map(([name, tool]) => ({ name, description: tool.description, parameters: tool.parameters }));
}
