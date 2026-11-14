import PageHeader from "@/components/ui/PageHeader";
import AiChat from "@/components/features/ai/AiChat";

export default function MyAi() {
  return (
    <>
      <PageHeader title="AI Assistant" description="Ask about your own records and company policies." />
      <AiChat role="employee" />
    </>
  );
}
