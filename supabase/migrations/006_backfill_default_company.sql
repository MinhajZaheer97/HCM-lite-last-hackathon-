-- HCM Lite — 006_backfill_default_company.sql
-- Phase 2: assign existing records to the current default company.
-- Non-destructive: updates ownership columns only; no rows are deleted.

begin;

do $$
declare
  company_count integer;
begin
  select count(*) into company_count from companies;
  if company_count <> 1 then
    raise exception 'Expected exactly one existing company before backfill; found %', company_count;
  end if;
end $$;

-- Reference and identity data.
update profiles set company_id = 1 where company_id is null;
update departments set company_id = 1 where company_id is null;
update designations set company_id = 1 where company_id is null;
update leave_types set company_id = 1 where company_id is null;
update employees set company_id = 1 where company_id is null;

-- Operational and payroll data.
update attendance_records set company_id = 1 where company_id is null;
update attendance_corrections set company_id = 1 where company_id is null;
update leave_requests set company_id = 1 where company_id is null;
update salary_structures set company_id = 1 where company_id is null;
update payroll_runs set company_id = 1 where company_id is null;
update payslips set company_id = 1 where company_id is null;
update announcements set company_id = 1 where company_id is null;
update notifications set company_id = 1 where company_id is null;
update audit_logs set company_id = 1 where company_id is null;

-- Fail atomically if any scoped row remains unassigned.
do $$
declare
  unassigned_count bigint;
begin
  select sum(total_count) into unassigned_count
  from (
    select count(*) as total_count from profiles where company_id is null
    union all select count(*) from departments where company_id is null
    union all select count(*) from designations where company_id is null
    union all select count(*) from leave_types where company_id is null
    union all select count(*) from employees where company_id is null
    union all select count(*) from attendance_records where company_id is null
    union all select count(*) from attendance_corrections where company_id is null
    union all select count(*) from leave_requests where company_id is null
    union all select count(*) from salary_structures where company_id is null
    union all select count(*) from payroll_runs where company_id is null
    union all select count(*) from payslips where company_id is null
    union all select count(*) from announcements where company_id is null
    union all select count(*) from notifications where company_id is null
    union all select count(*) from audit_logs where company_id is null
  ) counts;

  if coalesce(unassigned_count, 0) <> 0 then
    raise exception 'Backfill left % unassigned company-owned rows', unassigned_count;
  end if;
end $$;

commit;
