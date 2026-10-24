export default function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ title, subtitle, actions, className = "" }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-border px-5 py-4 ${className}`}
    >
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function CardBody({ className = "", ...props }) {
  return <div className={`p-5 ${className}`} {...props} />;
}
