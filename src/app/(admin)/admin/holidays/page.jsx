import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import SimpleCrud from "@/components/features/SimpleCrud";
import { saveHoliday, deleteHoliday } from "./actions";

export const metadata = { title: "Holidays — HCM Lite" };

export default async function HolidaysPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("holidays")
    .select("id, name, holiday_date")
    .order("holiday_date");

  return (
    <>
      <PageHeader
        title="Public Holidays"
        description="Company-wide holidays — excluded from working days, attendance, and payroll."
      />
      <SimpleCrud
        rows={rows ?? []}
        columns={[
          { key: "holiday_date", label: "Date" },
          { key: "name", label: "Name" },
        ]}
        fields={[
          { name: "name", label: "Holiday name", required: true, placeholder: "e.g. Independence Day" },
          { name: "holiday_date", label: "Date", type: "date", required: true },
        ]}
        saveAction={saveHoliday}
        deleteAction={deleteHoliday}
        addLabel="Add holiday"
        emptyTitle="No holidays configured"
        emptyDescription="Add company holidays so they are excluded from attendance and payroll calculations."
      />
    </>
  );
}
