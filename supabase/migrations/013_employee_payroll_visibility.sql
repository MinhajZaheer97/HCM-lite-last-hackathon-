-- ============================================================
-- HCM Lite - 013_employee_payroll_visibility.sql
-- Allow employees to see the finalized payroll run linked to
-- their own payslips, within their company.
-- ============================================================

begin;

drop policy if exists payroll_select on payroll_runs;
create policy payroll_select on payroll_runs
  for select to authenticated
  using (
    company_id = my_company_id()
    and (
      is_staff()
      or exists (
        select 1
        from payslips
        where payslips.run_id = payroll_runs.id
          and payslips.employee_id = my_employee_id()
          and payslips.company_id = my_company_id()
      )
    )
  );

commit;
