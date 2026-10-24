import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function MyLeave() {
  return (
    <>
      <PageHeader title="My Leave" description="Apply for leave, view balances and request history." />
      <ComingSoon phase="Phase 6" what="Leave applications and balances live here." />
    </>
  );
}
