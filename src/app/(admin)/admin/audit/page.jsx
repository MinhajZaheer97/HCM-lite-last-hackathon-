import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function AdminAudit() {
  return (
    <>
      <PageHeader title="Audit Log" description="Company-wide record of important operations." />
      <ComingSoon phase="Phase 9" what="The audit log viewer lives here." />
    </>
  );
}
