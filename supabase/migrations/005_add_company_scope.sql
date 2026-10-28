-- HCM Lite — 005_add_company_scope.sql
-- Phase 1: additive multi-company schema.
-- This migration does not delete rows and does not change application RLS.
-- Run only after recording the current schema/data state.

begin;

-- The original schema used a singleton company row. Keep existing id=1 data,
-- but allow future companies and allocate new integer IDs safely.
alter table companies drop constraint if exists companies_id_check;
create sequence if not exists companies_id_seq;
select setval(
  'companies_id_seq',
  coalesce((select max(id) from companies), 0) + 1,
  false
);
alter table companies alter column id set default nextval('companies_id_seq');
alter sequence companies_id_seq owned by companies.id;

-- Every business row will be owned by exactly one company after backfill.
alter table profiles add column if not exists company_id int;
alter table departments add column if not exists company_id int;
alter table designations add column if not exists company_id int;
alter table leave_types add column if not exists company_id int;
alter table employees add column if not exists company_id int;
alter table attendance_records add column if not exists company_id int;
alter table attendance_corrections add column if not exists company_id int;
alter table leave_requests add column if not exists company_id int;
alter table salary_structures add column if not exists company_id int;
alter table payroll_runs add column if not exists company_id int;
alter table payslips add column if not exists company_id int;
alter table announcements add column if not exists company_id int;
alter table notifications add column if not exists company_id int;
alter table audit_logs add column if not exists company_id int;

alter table profiles
  add constraint profiles_company_id_fkey
  foreign key (company_id) references companies(id);
alter table departments
  add constraint departments_company_id_fkey
  foreign key (company_id) references companies(id);
alter table designations
  add constraint designations_company_id_fkey
  foreign key (company_id) references companies(id);
alter table leave_types
  add constraint leave_types_company_id_fkey
  foreign key (company_id) references companies(id);
alter table employees
  add constraint employees_company_id_fkey
  foreign key (company_id) references companies(id);
alter table attendance_records
  add constraint attendance_records_company_id_fkey
  foreign key (company_id) references companies(id);
alter table attendance_corrections
  add constraint attendance_corrections_company_id_fkey
  foreign key (company_id) references companies(id);
alter table leave_requests
  add constraint leave_requests_company_id_fkey
  foreign key (company_id) references companies(id);
alter table salary_structures
  add constraint salary_structures_company_id_fkey
  foreign key (company_id) references companies(id);
alter table payroll_runs
  add constraint payroll_runs_company_id_fkey
  foreign key (company_id) references companies(id);
alter table payslips
  add constraint payslips_company_id_fkey
  foreign key (company_id) references companies(id);
alter table announcements
  add constraint announcements_company_id_fkey
  foreign key (company_id) references companies(id);
alter table notifications
  add constraint notifications_company_id_fkey
  foreign key (company_id) references companies(id);
alter table audit_logs
  add constraint audit_logs_company_id_fkey
  foreign key (company_id) references companies(id);

create index if not exists profiles_company_id_idx on profiles(company_id);
create index if not exists departments_company_id_idx on departments(company_id);
create index if not exists designations_company_id_idx on designations(company_id);
create index if not exists leave_types_company_id_idx on leave_types(company_id);
create index if not exists employees_company_id_idx on employees(company_id);
create index if not exists attendance_records_company_id_idx on attendance_records(company_id);
create index if not exists attendance_corrections_company_id_idx on attendance_corrections(company_id);
create index if not exists leave_requests_company_id_idx on leave_requests(company_id);
create index if not exists salary_structures_company_id_idx on salary_structures(company_id);
create index if not exists payroll_runs_company_id_idx on payroll_runs(company_id);
create index if not exists payslips_company_id_idx on payslips(company_id);
create index if not exists announcements_company_id_idx on announcements(company_id);
create index if not exists notifications_company_id_idx on notifications(company_id);
create index if not exists audit_logs_company_id_idx on audit_logs(company_id);

-- Each company may have at most one active Admin. NULL ownership remains
-- temporarily valid until the controlled backfill phase.
create unique index if not exists one_active_admin_per_company_idx
  on profiles(company_id)
  where role = 'admin' and is_active and company_id is not null;

commit;
