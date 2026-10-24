const variants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-brand-300",
  secondary:
    "border border-border bg-surface text-ink hover:bg-surface-muted focus-visible:outline-brand-600 disabled:text-ink-muted",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 focus-visible:outline-danger-600 disabled:bg-danger-600/40",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-brand-600",
};

const sizes = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
