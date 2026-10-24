import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildCsv } from "@/lib/csv";

// CSV export of the employee directory (HR + Admin only).
export async function GET() {
  const { profile } = await getCurrentProfile();
  if (!profile || !["hr", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("emp_code, full_name, email, phone, gender, dob, join_date, status, address, departments(name), designations(name)")
    .order("emp_code");

  const csv = buildCsv(
    (employees ?? []).map((e) => ({
      ...e,
      department: e.departments?.name ?? "",
      designation: e.designations?.name ?? "",
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
