export function Table({ className = "", ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${className}`} {...props} />
    </div>
  );
}

export function THead({ children }) {
  return (
    <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
      {children}
    </thead>
  );
}

export function TH({ className = "", ...props }) {
  return <th className={`px-4 py-2.5 font-medium ${className}`} {...props} />;
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({ className = "", ...props }) {
  return <tr className={`hover:bg-surface-muted/60 ${className}`} {...props} />;
}

export function TD({ className = "", ...props }) {
  return <td className={`px-4 py-3 align-middle ${className}`} {...props} />;
}
