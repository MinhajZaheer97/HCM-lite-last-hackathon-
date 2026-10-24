import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";

// Phase 0 placeholder. Phase 8 builds the real Admin dashboard: headcount,
// YTD attrition, payroll cost, leave utilization, department breakdowns,
// audit feed, and an AI summary — all from real database records.
export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Company-wide metrics, updated in Phase 8."
        actions={<Badge status="draft">Placeholder</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Headcount", "Attrition (YTD)", "Payroll cost", "Avg salary"].map((label) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
            <Skeleton className="mt-3 h-8 w-24" />
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-5">
        <p className="text-sm text-ink-muted">
          Metrics are intentionally empty: the business database starts with no records, and every
          number shown here will be computed from actions performed in the app.
        </p>
      </Card>
    </>
  );
}
