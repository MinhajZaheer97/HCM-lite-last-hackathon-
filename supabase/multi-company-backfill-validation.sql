-- Multi-company Phase 2 validation queries.
-- Run after 006_backfill_default_company.sql.
-- These queries are read-only.

-- All current rows should belong to company 1.
select 'profiles' as table_name, count(*) as total_rows, count(*) filter (where company_id = 1) as default_company_rows from profiles
union all select 'departments', count(*), count(*) filter (where company_id = 1) from departments
union all select 'designations', count(*), count(*) filter (where company_id = 1) from designations
union all select 'leave_types', count(*), count(*) filter (where company_id = 1) from leave_types
union all select 'employees', count(*), count(*) filter (where company_id = 1) from employees
union all select 'attendance_records', count(*), count(*) filter (where company_id = 1) from attendance_records
union all select 'attendance_corrections', count(*), count(*) filter (where company_id = 1) from attendance_corrections
union all select 'leave_requests', count(*), count(*) filter (where company_id = 1) from leave_requests
union all select 'salary_structures', count(*), count(*) filter (where company_id = 1) from salary_structures
union all select 'payroll_runs', count(*), count(*) filter (where company_id = 1) from payroll_runs
union all select 'payslips', count(*), count(*) filter (where company_id = 1) from payslips
union all select 'announcements', count(*), count(*) filter (where company_id = 1) from announcements
union all select 'notifications', count(*), count(*) filter (where company_id = 1) from notifications
union all select 'audit_logs', count(*), count(*) filter (where company_id = 1) from audit_logs
order by table_name;

-- Expected: zero rows.
select table_name, unassigned_rows
from (
  select 'profiles' as table_name, count(*) as unassigned_rows from profiles where company_id is null
  union all select 'departments', count(*) from departments where company_id is null
  union all select 'designations', count(*) from designations where company_id is null
  union all select 'leave_types', count(*) from leave_types where company_id is null
  union all select 'employees', count(*) from employees where company_id is null
  union all select 'attendance_records', count(*) from attendance_records where company_id is null
  union all select 'attendance_corrections', count(*) from attendance_corrections where company_id is null
  union all select 'leave_requests', count(*) from leave_requests where company_id is null
  union all select 'salary_structures', count(*) from salary_structures where company_id is null
  union all select 'payroll_runs', count(*) from payroll_runs where company_id is null
  union all select 'payslips', count(*) from payslips where company_id is null
  union all select 'announcements', count(*) from announcements where company_id is null
  union all select 'notifications', count(*) from notifications where company_id is null
  union all select 'audit_logs', count(*) from audit_logs where company_id is null
) ownership
where unassigned_rows > 0;
