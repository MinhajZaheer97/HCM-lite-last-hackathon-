const base =
  "w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#10264A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 disabled:bg-[#F5F8FD]";

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger-600">{error}</span>}
    </label>
  );
}

export default function Input({ className = "", ...props }) {
  return <input className={`${base} ${className}`} {...props} />;
}

export function Textarea({ className = "", rows = 3, ...props }) {
  return <textarea rows={rows} className={`${base} ${className}`} {...props} />;
}
