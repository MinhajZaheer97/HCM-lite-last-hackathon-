import PageHeader from "@/components/ui/PageHeader";
import AiChat from "@/components/features/ai/AiChat";

export default function AdminAi() {
  return (
    <>
      <PageHeader title="AI Assistant" description="Ask questions about company-wide data and policies." />
      <AiChat role="admin" />
    </>
  );
}
