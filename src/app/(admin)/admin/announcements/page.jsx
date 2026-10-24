import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function AdminAnnouncements() {
  return (
    <>
      <PageHeader title="Announcements" description="Post company-wide announcements." />
      <ComingSoon phase="Phase 9" what="Announcement posting lives here." />
    </>
  );
}
