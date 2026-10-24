import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function MyPayslips() {
  return (
    <>
      <PageHeader title="My Payslips" description="View and download your payslip PDFs." />
      <ComingSoon phase="Phase 7" what="Your payslip list and PDF downloads live here." />
    </>
  );
}
