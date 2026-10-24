import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";

// Phase 0 placeholder. Phase 8 builds the real HR dashboard: headcount,
// present today, on leave today, late arrivals, department absenteeism,
// outstanding approvals, and top latecomers — all from real records.
export default function HrDashboard() {
  return (
    <>
      <PageHeader
        title="HR Dashboard"
        description="Day-to-day HR metrics, updated in Phase 8."
        actions={<Badge status="draft">Placeholder</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Headcount", "Present today", "On leave today", "Late today"].map((label) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
            <Skeleton className="mt-3 h-8 w-24" />
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-5">
        <p className="text-sm text-ink-muted">
          Metrics are intentionally empty: every number will be computed from real records created
          through the app.
        </p>
      </Card>
    </>
  );
}
