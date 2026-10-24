import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";

// Phase 0 placeholder. Phase 8 builds the real Employee dashboard:
// check-in/out, weekly hours vs 40h reference, late count, leave balance,
// latest payslip, and announcements — all from real records.
export default function EmployeeDashboard() {
  return (
    <>
      <PageHeader
        title="My Dashboard"
        description="Your day at a glance, updated in Phase 8."
        actions={<Badge status="draft">Placeholder</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Check-in", "Hours this week", "Late arrivals", "Leave balance"].map((label) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
            <Skeleton className="mt-3 h-8 w-24" />
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-5">
        <p className="text-sm text-ink-muted">
          Your attendance, leave, and payslip data will appear here once the corresponding modules
          are live — nothing is pre-seeded.
        </p>
      </Card>
    </>
  );
}
