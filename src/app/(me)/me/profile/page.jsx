import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui";
import ComingSoon from "@/components/layout/ComingSoon";

export const metadata = { title: "My Profile — HCM Lite" };

// Employee self-service profile: reads the signed-in employee's own record
// (RLS guarantees only their row is visible).
export default async function MyProfilePage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("employee_id")
    .eq("id", (await supabase.auth.getUser()).data?.user?.id)
    .single();

  if (!profile?.employee_id) {
    return (
      <>
        <PageHeader title="My Profile" />
        <ComingSoon phase="a later phase" what="Your profile is not linked to an employee record yet — contact HR." />
      </>
    );
  }

  const { data: employee } = await supabase
    .from("employees")
    .select(
      `emp_code, full_name, email, phone, gender, dob, address, join_date, status,
       departments(name), designations(name)`
    )
    .eq("id", profile.employee_id)
    .single();

  if (!employee) {
    return (
      <>
        <PageHeader title="My Profile" />
        <ComingSoon phase="a later phase" what="Employee record not found — contact HR." />
      </>
    );
  }

  const rows = [
    ["Employee code", employee.emp_code],
    ["Email", employee.email],
    ["Phone", employee.phone ?? "—"],
    ["Gender", employee.gender ?? "—"],
    ["Date of birth", employee.dob ?? "—"],
    ["Address", employee.address ?? "—"],
  ];
  const jobRows = [
    ["Department", employee.departments?.name ?? "—"],
    ["Designation", employee.designations?.name ?? "—"],
    ["Join date", employee.join_date],
    ["Employment status", employee.status],
  ];

  return (
    <>
      <PageHeader title="My Profile" description="Your personal and job information. Contact HR to request corrections." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal information" />
          <CardBody>
            <dl className="space-y-2 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-right font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Job information" />
          <CardBody>
            <dl className="space-y-2 text-sm">
              {jobRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-right font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
