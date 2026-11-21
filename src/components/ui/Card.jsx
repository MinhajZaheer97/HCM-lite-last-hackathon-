export default function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(11,31,58,0.04),0_4px_12px_rgba(11,31,58,0.02)] ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ title, subtitle, actions, className = "" }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-5 py-4 ${className}`}
    >
      <div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#10264A]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-[#64748B]">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function CardBody({ className = "", ...props }) {
  return <div className={`p-5 ${className}`} {...props} />;
}
