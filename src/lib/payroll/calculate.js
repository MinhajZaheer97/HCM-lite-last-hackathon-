export function sumAllowances(allowances = {}) {
  return Object.values(allowances).reduce((sum, value) => sum + Number(value || 0), 0);
}

export function calculatePayslip({ basic = 0, allowances = {}, workingDays, absentDays = 0, unpaidLeaveDays = 0, halfDays = 0 }) {
  const gross = Number(basic) + sumAllowances(allowances);
  const lopDays = Number(absentDays) + Number(unpaidLeaveDays) + Number(halfDays) * 0.5;
  const perDay = workingDays > 0 ? gross / Number(workingDays) : 0;
  const totalDeductions = Math.round(perDay * lopDays * 100) / 100;
  const net = Math.round((gross - totalDeductions) * 100) / 100;
  return {
    gross: Math.round(gross * 100) / 100,
    totalDeductions,
    net,
    daysWorked: Math.max(0, Number(workingDays) - lopDays),
    lopDays,
    deductionItems: [
      ...(Number(absentDays) ? [{ label: "Absent days", days: Number(absentDays), amount: Math.round(perDay * Number(absentDays) * 100) / 100 }] : []),
      ...(Number(unpaidLeaveDays) ? [{ label: "Unpaid leave", days: Number(unpaidLeaveDays), amount: Math.round(perDay * Number(unpaidLeaveDays) * 100) / 100 }] : []),
      ...(Number(halfDays) ? [{ label: "Half days", days: Number(halfDays), amount: Math.round(perDay * Number(halfDays) * 0.5 * 100) / 100 }] : []),
    ],
  };
}
