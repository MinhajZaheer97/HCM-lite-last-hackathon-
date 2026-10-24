import Card from "@/components/ui/Card";

// Shared placeholder for routes whose functionality arrives in a later phase.
export default function ComingSoon({ title, phase, what }) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        {what} This page becomes functional in {phase}; the navigation and layout you see now are
        part of the Phase 0 foundation.
      </p>
      <span className="mt-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        {phase}
      </span>
    </Card>
  );
}
