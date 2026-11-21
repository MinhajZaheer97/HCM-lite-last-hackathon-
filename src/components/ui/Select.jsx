export default function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#10264A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 disabled:bg-[#F5F8FD] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
