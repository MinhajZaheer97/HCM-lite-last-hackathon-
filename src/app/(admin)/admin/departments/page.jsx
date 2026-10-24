import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import SimpleCrud from "@/components/features/SimpleCrud";
import { saveDepartment, deleteDepartment } from "./actions";

export const metadata = { title: "Departments — HCM Lite" };

export default async function DepartmentsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  return (
    <>
      <PageHeader
        title="Departments"
        description="Company departments — used to group employees, designations, and reports."
      />
      <SimpleCrud
        rows={rows ?? []}
        columns={[{ key: "name", label: "Name" }]}
        fields={[{ name: "name", label: "Department name", required: true, placeholder: "e.g. Engineering" }]}
        saveAction={saveDepartment}
        deleteAction={deleteDepartment}
        addLabel="Add department"
        emptyTitle="No departments yet"
        emptyDescription="Create your first department — employees will be assigned to departments when HR registers them."
      />
    </>
  );
}
