export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.015em] text-[#10264A]">{title}</h1>
        {description && <p className="mt-1 text-[13px] font-medium text-[#64748B]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
