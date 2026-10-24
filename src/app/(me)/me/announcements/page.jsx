import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function MyAnnouncements() {
  return (
    <>
      <PageHeader title="Announcements" description="Company announcements from Admin and HR." />
      <ComingSoon phase="Phase 9" what="The announcement feed lives here." />
    </>
  );
}
