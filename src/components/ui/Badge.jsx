const tones = {
  neutral: "bg-surface-muted text-ink-muted border-border",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  success: "bg-success-50 text-success-700 border-success-600/20",
  warning: "bg-warning-50 text-warning-700 border-warning-600/20",
  danger: "bg-danger-50 text-danger-700 border-danger-600/20",
};

// Common HR status → tone mapping so badges stay consistent app-wide.
const statusTones = {
  active: "success",
  probation: "warning",
  exited: "danger",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
  present: "success",
  late: "warning",
  half_day: "warning",
  missing_checkout: "danger",
  on_leave: "brand",
  absent: "danger",
  draft: "warning",
  finalized: "success",
};

export default function Badge({ tone, status, className = "", children }) {
  const resolved = tone || statusTones[children] || "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${tones[resolved]} ${className}`}
    >
      {typeof children === "string" ? children.replaceAll("_", " ") : children}
    </span>
  );
}
