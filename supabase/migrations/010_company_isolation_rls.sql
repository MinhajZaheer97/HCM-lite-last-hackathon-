-- ============================================================
-- HCM Lite - 010_company_isolation_rls.sql
-- Enforce tenant isolation for every company-owned table.
-- ============================================================

begin;

create or replace function my_company_id() returns int
language sql stable security definer set search_path = public as $$
  select company_id from profiles where id = auth.uid() and is_active;
$$;

alter table holidays add column if not exists company_id int;

do $$
declare
  v_company_id int;
begin
  select id into v_company_id from companies order by id limit 1;
  if v_company_id is not null then
    update holidays set company_id = v_company_id where company_id is null;
  end if;
end $$;

alter table holidays
  add constraint holidays_company_id_fkey
  foreign key (company_id) references companies(id);

alter table holidays alter column company_id set not null;
alter table holidays drop constraint if exists holidays_holiday_date_key;
alter table holidays add constraint holidays_company_date_key unique (company_id, holiday_date);
create index if not exists holidays_company_id_idx on holidays(company_id);

alter table audit_logs drop constraint if exists audit_logs_company_id_fkey;
alter table audit_logs
  add constraint audit_logs_company_id_fkey
  foreign key (company_id) references companies(id);

drop policy if exists companies_select on companies;
drop policy if exists companies_update on companies;
create policy companies_select on companies
  for select to authenticated using (id = my_company_id());
create policy companies_update on companies
  for update to authenticated
  using (id = my_company_id() and is_admin())
  with check (id = my_company_id() and is_admin());

drop policy if exists holidays_select on holidays;
drop policy if exists holidays_write on holidays;
create policy holidays_select on holidays
  for select to authenticated using (company_id = my_company_id());
create policy holidays_write on holidays
  for all to authenticated
  using (company_id = my_company_id() and is_admin())
  with check (company_id = my_company_id() and is_admin());

drop policy if exists departments_select on departments;
drop policy if exists departments_write on departments;
create policy departments_select on departments
  for select to authenticated using (company_id = my_company_id());
create policy departments_write on departments
  for all to authenticated
  using (company_id = my_company_id() and is_admin())
  with check (company_id = my_company_id() and is_admin());

drop policy if exists designations_select on designations;
drop policy if exists designations_write on designations;
create policy designations_select on designations
  for select to authenticated using (company_id = my_company_id());
create policy designations_write on designations
  for all to authenticated
  using (company_id = my_company_id() and is_admin())
  with check (company_id = my_company_id() and is_admin());

drop policy if exists leave_types_select on leave_types;
drop policy if exists leave_types_write on leave_types;
create policy leave_types_select on leave_types
  for select to authenticated using (company_id = my_company_id());
create policy leave_types_write on leave_types
  for all to authenticated
  using (company_id = my_company_id() and is_admin())
  with check (company_id = my_company_id() and is_admin());

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select to authenticated
  using (id = auth.uid() or (is_staff() and company_id = my_company_id()));

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid() and company_id = my_company_id())
  with check (id = auth.uid() and company_id = my_company_id());

drop policy if exists employees_select on employees;
drop policy if exists employees_insert on employees;
drop policy if exists employees_update on employees;
drop policy if exists employees_delete on employees;
create policy employees_select on employees
  for select to authenticated
  using (company_id = my_company_id() and (is_staff() or id = my_employee_id()));
create policy employees_insert on employees
  for insert to authenticated
  with check (company_id = my_company_id() and is_staff());
create policy employees_update on employees
  for update to authenticated
  using (company_id = my_company_id() and is_staff())
  with check (company_id = my_company_id() and is_staff());
create policy employees_delete on employees
  for delete to authenticated
  using (company_id = my_company_id() and is_admin());

drop policy if exists attendance_select on attendance_records;
drop policy if exists attendance_insert on attendance_records;
drop policy if exists attendance_update on attendance_records;
drop policy if exists attendance_delete on attendance_records;
create policy attendance_select on attendance_records
  for select to authenticated
  using (company_id = my_company_id() and (is_staff() or employee_id = my_employee_id()));
create policy attendance_insert on attendance_records
  for insert to authenticated
  with check (company_id = my_company_id() and (is_staff() or employee_id = my_employee_id()));
create policy attendance_update on attendance_records
  for update to authenticated
  using (company_id = my_company_id() and is_staff())
  with check (company_id = my_company_id() and is_staff());
create policy attendance_delete on attendance_records
  for delete to authenticated
  using (company_id = my_company_id() and is_admin());

drop policy if exists corrections_select on attendance_corrections;
drop policy if exists corrections_insert on attendance_corrections;
drop policy if exists corrections_update on attendance_corrections;
create policy corrections_select on attendance_corrections
  for select to authenticated
  using (company_id = my_company_id() and (is_staff() or employee_id = my_employee_id()));
create policy corrections_insert on attendance_corrections
  for insert to authenticated
  with check (company_id = my_company_id() and employee_id = my_employee_id());
create policy corrections_update on attendance_corrections
  for update to authenticated
  using (company_id = my_company_id() and is_staff())
  with check (company_id = my_company_id() and is_staff());

drop policy if exists leave_select on leave_requests;
drop policy if exists leave_insert on leave_requests;
drop policy if exists leave_update_own_cancel on leave_requests;
drop policy if exists leave_update_staff on leave_requests;
create policy leave_select on leave_requests
  for select to authenticated
  using (company_id = my_company_id() and (is_staff() or employee_id = my_employee_id()));
create policy leave_insert on leave_requests
  for insert to authenticated
  with check (company_id = my_company_id() and (is_staff() or employee_id = my_employee_id()));
create policy leave_update_own_cancel on leave_requests
  for update to authenticated
  using (company_id = my_company_id() and employee_id = my_employee_id() and status = 'pending')
  with check (company_id = my_company_id() and employee_id = my_employee_id() and status = 'cancelled');
create policy leave_update_staff on leave_requests
  for update to authenticated
  using (company_id = my_company_id() and is_staff())
  with check (company_id = my_company_id() and is_staff());

drop policy if exists salary_select on salary_structures;
drop policy if exists salary_write on salary_structures;
create policy salary_select on salary_structures
  for select to authenticated
  using (company_id = my_company_id() and (is_staff() or employee_id = my_employee_id()));
create policy salary_write on salary_structures
  for all to authenticated
  using (company_id = my_company_id() and is_staff())
  with check (company_id = my_company_id() and is_staff());

drop policy if exists payroll_select on payroll_runs;
drop policy if exists payroll_write on payroll_runs;
create policy payroll_select on payroll_runs
  for select to authenticated
  using (company_id = my_company_id() and is_staff());
create policy payroll_write on payroll_runs
  for all to authenticated
  using (company_id = my_company_id() and is_staff())
  with check (company_id = my_company_id() and is_staff());

drop policy if exists payslips_select on payslips;
drop policy if exists payslips_write on payslips;
create policy payslips_select on payslips
  for select to authenticated
  using (company_id = my_company_id() and (is_staff() or employee_id = my_employee_id()));
create policy payslips_write on payslips
  for all to authenticated
  using (company_id = my_company_id() and is_staff())
  with check (company_id = my_company_id() and is_staff());

drop policy if exists announcements_select on announcements;
drop policy if exists announcements_insert on announcements;
drop policy if exists announcements_admin_modify on announcements;
drop policy if exists announcements_admin_delete on announcements;
create policy announcements_select on announcements
  for select to authenticated using (company_id = my_company_id());
create policy announcements_insert on announcements
  for insert to authenticated
  with check (company_id = my_company_id() and is_staff());
create policy announcements_admin_modify on announcements
  for update to authenticated
  using (company_id = my_company_id() and is_admin())
  with check (company_id = my_company_id() and is_admin());
create policy announcements_admin_delete on announcements
  for delete to authenticated
  using (company_id = my_company_id() and is_admin());

drop policy if exists audit_select_admin on audit_logs;
drop policy if exists audit_select_hr_limited on audit_logs;
create policy audit_select_admin on audit_logs
  for select to authenticated
  using (company_id = my_company_id() and is_admin());
create policy audit_select_hr_limited on audit_logs
  for select to authenticated
  using (
    company_id = my_company_id()
    and is_hr()
    and entity in ('employees', 'leave_requests', 'attendance_records', 'attendance_corrections')
  );

commit;
