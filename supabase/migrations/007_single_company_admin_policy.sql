-- HCM Lite — 007_single_company_admin_policy.sql
-- Enforce the selected model: one company per admin, one company per user,
-- and every company-owned row must carry a non-null company_id.

begin;

-- After the controlled 006 backfill, every user and every business row should be
-- assigned to the active company. Lock this down at the DB layer.
alter table profiles alter column company_id set not null;
alter table departments alter column company_id set not null;
alter table designations alter column company_id set not null;
alter table leave_types alter column company_id set not null;
alter table employees alter column company_id set not null;
alter table attendance_records alter column company_id set not null;
alter table attendance_corrections alter column company_id set not null;
alter table leave_requests alter column company_id set not null;
alter table salary_structures alter column company_id set not null;
alter table payroll_runs alter column company_id set not null;
alter table payslips alter column company_id set not null;
alter table announcements alter column company_id set not null;
alter table notifications alter column company_id set not null;
alter table audit_logs alter column company_id set not null;

-- The app already enforces one active Admin per company. Keep it enforced in SQL.
create unique index if not exists one_active_admin_per_company_idx
  on profiles(company_id)
  where role = 'admin' and is_active and company_id is not null;

commit;
