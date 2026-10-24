import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/layout/ComingSoon";

export default function HrAnnouncements() {
  return (
    <>
      <PageHeader title="Announcements" description="Post announcements visible to employees." />
      <ComingSoon phase="Phase 9" what="Announcement posting lives here." />
    </>
  );
}
