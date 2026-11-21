const paths = {
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  calendar: (
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </>
  ),
  leave: (
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M12 14l2 2 4-4" />
    </>
  ),
  wallet: (
    <>
      <path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6" />
      <path d="M16 13h4" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18M7 16v-3M11 16V8M15 16v-5M19 16V5" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3-1.6 4.4L6 9l4.4 1.6L12 15l1.6-4.4L18 9l-4.4-1.6L12 3Z" />
      <path d="m5 16-.7 1.8L2.5 18.5l1.8.7L5 21l.7-1.8 1.8-.7-1.8-.7L5 16ZM19 14l-.5 1.5-1.5.5 1.5.5L19 18l.5-1.5 1.5-.5-1.5-.5L19 14Z" />
    </>
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM9 12l2 2 4-4" />
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="m7 4 13 8-13 8V4Z" />,
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
};

export default function LandingIcon({ name, className = "h-5 w-5", ...props }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {paths[name] ?? paths.sparkle}
    </svg>
  );
}
