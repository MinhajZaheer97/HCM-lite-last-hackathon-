import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function AdminEmployees() {
  return (
    <>
      <PageHeader title="Employees" description="Company-wide employee directory." />
      <ComingSoon phase="Phase 4" what="The employee directory (read-only for Admin) lives here." />
    </>
  );
}
