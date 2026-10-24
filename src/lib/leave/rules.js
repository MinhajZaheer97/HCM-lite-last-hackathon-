import { dayType } from "../attendance/rules.js";

export function listWorkingDates(startDate, endDate, { weekendDays = [0, 6], holidays = [] } = {}) {
  const dates = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    if (dayType(date, { weekendDays, holidays }) === "workday") dates.push(date);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function requestedLeaveDays(startDate, endDate, options = {}, isHalfDay = false) {
  const workingDates = listWorkingDates(startDate, endDate, options);
  return isHalfDay ? (workingDates.length === 1 ? 0.5 : 0) : workingDates.length;
}

export function leaveBalance(annualDays, usedDays) {
  return Math.max(0, Number(annualDays || 0) - Number(usedDays || 0));
}
