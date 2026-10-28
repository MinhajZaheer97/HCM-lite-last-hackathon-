-- ============================================================
-- HCM Lite - 014_employee_checkout_rls.sql
-- Allow employees to complete their own attendance checkout.
-- ============================================================

begin;

drop policy if exists attendance_update on attendance_records;
create policy attendance_update on attendance_records
  for update to authenticated
  using (
    company_id = my_company_id()
    and (is_staff() or employee_id = my_employee_id())
  )
  with check (
    company_id = my_company_id()
    and (is_staff() or employee_id = my_employee_id())
  );

commit;
