-- Allow employees to read the payroll run linked to their own payslips.
-- This is required for embedded payroll_runs status/period fields.
drop policy if exists payroll_select on payroll_runs;
create policy payroll_select on payroll_runs
  for select to authenticated
  using (
    is_staff()
    or exists (
      select 1
      from payslips
      where payslips.run_id = payroll_runs.id
        and payslips.employee_id = my_employee_id()
    )
  );
