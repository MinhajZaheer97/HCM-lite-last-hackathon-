import PageHeader from "@/components/ui/PageHeader";
import AiChat from "@/components/features/ai/AiChat";

export default function HrAi() {
  return (
    <>
      <PageHeader title="AI Assistant" description="Ask questions about HR data and policies." />
      <AiChat role="hr" />
    </>
  );
}
