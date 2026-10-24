import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function AdminLeave() {
  return (
    <>
      <PageHeader title="Leave" description="Company-wide leave requests and balances." />
      <ComingSoon phase="Phase 6" what="Company-wide leave oversight lives here." />
    </>
  );
}
