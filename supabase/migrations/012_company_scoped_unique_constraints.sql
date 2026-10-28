-- ============================================================
-- HCM Lite - 012_company_scoped_unique_constraints.sql
-- Remove remaining global organization uniqueness assumptions.
-- ============================================================

begin;

alter table departments drop constraint if exists departments_name_key;
alter table departments
  add constraint departments_company_name_key unique (company_id, name);

alter table designations drop constraint if exists designations_name_department_id_key;
alter table designations
  add constraint designations_company_name_department_key
  unique (company_id, name, department_id);

alter table leave_types drop constraint if exists leave_types_name_key;
alter table leave_types
  add constraint leave_types_company_name_key unique (company_id, name);

alter table payroll_runs drop constraint if exists payroll_runs_period_month_key;
alter table payroll_runs
  add constraint payroll_runs_company_period_key unique (company_id, period_month);

commit;
