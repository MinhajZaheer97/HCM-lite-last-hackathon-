import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function AdminPayroll() {
  return (
    <>
      <PageHeader title="Payroll" description="Monthly payroll runs, finalization, and locking." />
      <ComingSoon phase="Phase 7" what="Payroll review and finalization lives here." />
    </>
  );
}
