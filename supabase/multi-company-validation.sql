-- Multi-company Phase 1 validation queries.
-- Run in Supabase SQL Editor after 005_add_company_scope.sql.
-- These queries are read-only and do not expose credentials.

-- 1. Every company-owned table must have the new ownership column.
select table_name
from information_schema.columns
where table_schema = 'public'
  and column_name = 'company_id'
order by table_name;

-- 2. Confirm ownership foreign keys exist.
select
  tc.table_name,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
 and kcu.table_schema = tc.table_schema
where tc.table_schema = 'public'
  and tc.constraint_type = 'FOREIGN KEY'
  and kcu.column_name = 'company_id'
order by tc.table_name;

-- 3. Count rows and currently unassigned rows for every scoped table.
select 'profiles' as table_name, count(*) as total_rows, count(*) filter (where company_id is null) as unassigned_rows from profiles
union all select 'departments', count(*), count(*) filter (where company_id is null) from departments
union all select 'designations', count(*), count(*) filter (where company_id is null) from designations
union all select 'leave_types', count(*), count(*) filter (where company_id is null) from leave_types
union all select 'employees', count(*), count(*) filter (where company_id is null) from employees
union all select 'attendance_records', count(*), count(*) filter (where company_id is null) from attendance_records
union all select 'attendance_corrections', count(*), count(*) filter (where company_id is null) from attendance_corrections
union all select 'leave_requests', count(*), count(*) filter (where company_id is null) from leave_requests
union all select 'salary_structures', count(*), count(*) filter (where company_id is null) from salary_structures
union all select 'payroll_runs', count(*), count(*) filter (where company_id is null) from payroll_runs
union all select 'payslips', count(*), count(*) filter (where company_id is null) from payslips
union all select 'announcements', count(*), count(*) filter (where company_id is null) from announcements
union all select 'notifications', count(*), count(*) filter (where company_id is null) from notifications
union all select 'audit_logs', count(*), count(*) filter (where company_id is null) from audit_logs
order by table_name;

-- 4. One active Admin per assigned company.
select company_id, count(*) as active_admins
from profiles
where role = 'admin' and is_active and company_id is not null
group by company_id
having count(*) > 1;

-- 5. Every profile belongs to at most one company by construction (one row per auth user).
select id, count(*) as profile_rows
from profiles
group by id
having count(*) > 1;
