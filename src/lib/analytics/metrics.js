export function headcount(employees = [], date = null) {
  return employees.filter((employee) => {
    if (!["active", "probation"].includes(employee.status)) return false;
    if (date && employee.join_date > date) return false;
    return !date || !employee.exit_date || employee.exit_date >= date;
  }).length;
}

export function attendanceSummary(records = []) {
  const counts = { present: 0, late: 0, half_day: 0, missing_checkout: 0, absent: 0, on_leave: 0 };
  for (const record of records) counts[record.status] = (counts[record.status] ?? 0) + 1;
  const eligible = records.filter((record) => record.status !== "on_leave").length;
  const attended = counts.present + counts.late + counts.missing_checkout + counts.half_day * 0.5;
  return {
    counts,
    attendanceRate: eligible ? Math.round((attended / eligible) * 1000) / 10 : 0,
    lateRate: eligible ? Math.round((counts.late / eligible) * 1000) / 10 : 0,
  };
}

export function payrollSummary(runs = []) {
  const finalized = runs.filter((run) => run.status === "finalized");
  const slips = finalized.flatMap((run) => run.payslips ?? []);
  const gross = slips.reduce((sum, slip) => sum + Number(slip.gross || 0), 0);
  const net = slips.reduce((sum, slip) => sum + Number(slip.net || 0), 0);
  return { gross, net, averageSalary: slips.length ? gross / slips.length : 0, runs: finalized.length };
}
