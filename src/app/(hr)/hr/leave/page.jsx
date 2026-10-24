import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function HrLeave() {
  return (
    <>
      <PageHeader title="Leave Requests" description="Review, approve, or reject leave requests." />
      <ComingSoon phase="Phase 6" what="Leave approvals live here." />
    </>
  );
}
