import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import SimpleCrud from "@/components/features/SimpleCrud";
import { saveDesignation, deleteDesignation } from "./actions";

export const metadata = { title: "Designations — HCM Lite" };

export default async function DesignationsPage() {
  const supabase = await createClient();
  const [{ data: rows }, { data: departments }] = await Promise.all([
    supabase
      .from("designations")
      .select("id, name, department_id, departments(name)")
      .order("name"),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  // Compute display values server-side: functions can't cross into the
  // client component, so rows carry ready-to-render strings.
  const displayRows = (rows ?? []).map((r) => ({
    ...r,
    department: departments?.find((d) => d.id === r.department_id)?.name ?? "—",
  }));

  return (
    <>
      <PageHeader
        title="Designations"
        description="Job titles employees hold, optionally grouped under a department."
      />
      <SimpleCrud
        rows={displayRows}
        columns={[
          { key: "name", label: "Name" },
          { key: "department", label: "Department" },
        ]}
        fields={[
          { name: "name", label: "Designation name", required: true, placeholder: "e.g. Software Engineer" },
          {
            name: "department_id",
            label: "Department",
            type: "select",
            options: (departments ?? []).map((d) => ({ value: d.id, label: d.name })),
          },
        ]}
        saveAction={saveDesignation}
        deleteAction={deleteDesignation}
        addLabel="Add designation"
        emptyTitle="No designations yet"
        emptyDescription="Create job titles — HR will assign them when registering employees."
      />
    </>
  );
}
