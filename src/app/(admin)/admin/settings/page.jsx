import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import SettingsForm from "./settings-form";

export const metadata = { title: "Company Settings — HCM Lite" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("*").eq("id", 1).single();

  return (
    <>
      <PageHeader
        title="Company Settings"
        description="Company profile and the policies every module obeys."
      />
      <SettingsForm
        company={{
          name: company?.name ?? "",
          address: company?.address ?? "",
          office_location: company?.office_location ?? "",
          timezone: company?.timezone ?? "Asia/Karachi",
          currency: company?.currency ?? "PKR",
          office_start: company?.office_start ?? "09:00",
          office_end: company?.office_end ?? "17:00",
          grace_minutes: company?.grace_minutes ?? 10,
          weekend_days: company?.weekend_days ?? [0, 6],
        }}
      />
    </>
  );
}
