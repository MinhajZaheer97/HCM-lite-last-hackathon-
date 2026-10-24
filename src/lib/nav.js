// Role-aware navigation. The nav lists routes per role; actual security is
// enforced server-side (layouts, server actions, RLS) — this only shapes UX.
export const roleLabels = {
  admin: "Admin",
  hr: "HR",
  employee: "Employee",
};

export const navByRole = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/settings", label: "Company Settings" },
    { href: "/admin/departments", label: "Departments" },
    { href: "/admin/designations", label: "Designations" },
    { href: "/admin/leave-types", label: "Leave Types" },
    { href: "/admin/holidays", label: "Holidays" },
    { href: "/admin/hr-accounts", label: "HR Accounts" },
    { href: "/admin/employees", label: "Employees" },
    { href: "/admin/attendance", label: "Attendance" },
    { href: "/admin/leave", label: "Leave" },
    { href: "/admin/payroll", label: "Payroll" },
    { href: "/admin/announcements", label: "Announcements" },
    { href: "/admin/audit", label: "Audit Log" },
    { href: "/admin/ai", label: "AI Assistant" },
  ],
  hr: [
    { href: "/hr/dashboard", label: "Dashboard" },
    { href: "/hr/employees", label: "Employees" },
    { href: "/hr/attendance", label: "Attendance" },
    { href: "/hr/leave", label: "Leave Requests" },
    { href: "/hr/payroll", label: "Payroll" },
    { href: "/hr/announcements", label: "Announcements" },
    { href: "/hr/ai", label: "AI Assistant" },
  ],
  employee: [
    { href: "/me/dashboard", label: "Dashboard" },
    { href: "/me/attendance", label: "My Attendance" },
    { href: "/me/leave", label: "My Leave" },
    { href: "/me/payslips", label: "My Payslips" },
    { href: "/me/profile", label: "My Profile" },
    { href: "/me/announcements", label: "Announcements" },
    { href: "/me/ai", label: "AI Assistant" },
  ],
};
