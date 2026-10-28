-- HCM Lite — 006_backfill_default_company.sql
-- Phase 2: assign existing records to the current default company.
-- Non-destructive: updates ownership columns only; no rows are deleted.

begin;

-- The existing finalization guards protect every update to finalized payroll
-- rows. Permit only this explicit ownership-only backfill, while keeping all
-- normal finalized payroll and payslip edits locked.
create or replace function guard_payroll_run() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.status = 'finalized'
     and not (
       tg_op = 'UPDATE'
       and old.company_id is null
       and new.company_id is not null
       and current_setting('hcm.allow_company_backfill', true) = 'on'
     ) then
    raise exception 'Payroll run % is finalized and locked', old.period_month;
  end if;
  if tg_op = 'UPDATE'
     and new.status = 'finalized'
     and old.status <> 'finalized'
     and not coalesce((select true from profiles where id = auth.uid() and role = 'admin' and is_active), false)
     and current_setting('hcm.allow_company_backfill', true) <> 'on' then
    raise exception 'Only an Admin can finalize a payroll run';
  end if;
  return coalesce(new, old);
end $$;

create or replace function guard_payslip() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_run uuid := coalesce(old.run_id, new.run_id);
  v_finalized boolean;
begin
  select status = 'finalized' into v_finalized from payroll_runs where id = v_run;
  if coalesce(v_finalized, false)
     and not (
       tg_op = 'UPDATE'
       and old.company_id is null
       and new.company_id is not null
       and current_setting('hcm.allow_company_backfill', true) = 'on'
     ) then
    raise exception 'Payslip belongs to a finalized payroll run and is locked';
  end if;
  return coalesce(new, old);
end $$;

do $$
declare
  company_count integer;
begin
  select count(*) into company_count from companies;
  if company_count <> 1 then
    raise exception 'Expected exactly one existing company before backfill; found %', company_count;
  end if;
end $$;

select set_config('hcm.allow_company_backfill', 'on', true);

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
