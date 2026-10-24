import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import SimpleCrud from "@/components/features/SimpleCrud";
import { saveLeaveType, deleteLeaveType } from "./actions";

export const metadata = { title: "Leave Types — HCM Lite" };

export default async function LeaveTypesPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("leave_types")
    .select("id, name, annual_days, is_paid")
    .order("name");

  const displayRows = (rows ?? []).map((r) => ({
    ...r,
    annual_days_label: `${r.annual_days} days`,
    is_paid_label: r.is_paid ? "Paid" : "Unpaid",
  }));

  return (
    <>
      <PageHeader
        title="Leave Types"
        description="Leave categories with annual quotas per employee (calendar year) and paid status."
      />
      <SimpleCrud
        rows={displayRows}
        columns={[
          { key: "name", label: "Name" },
          { key: "annual_days_label", label: "Annual days" },
          { key: "is_paid_label", label: "Paid" },
        ]}
        fields={[
          { name: "name", label: "Leave type name", required: true, placeholder: "e.g. Annual Leave" },
          { name: "annual_days", label: "Annual quota (days)", type: "number", step: "0.5", placeholder: "e.g. 14" },
          { name: "is_paid", label: "Paid leave", type: "checkbox" },
        ]}
        saveAction={saveLeaveType}
        deleteAction={deleteLeaveType}
        addLabel="Add leave type"
        emptyTitle="No leave types yet"
        emptyDescription="Employees cannot apply for leave until at least one leave type exists."
      />
      <p className="mt-4 text-xs text-ink-muted">
        Quotas apply per calendar year without mid-year proration (documented v1 rule). Unpaid
        approved leave is deducted in payroll as loss-of-pay days.
      </p>
    </>
  );
}
