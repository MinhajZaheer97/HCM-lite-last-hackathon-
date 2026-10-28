-- ============================================================
-- HCM Lite — 003_triggers.sql
-- Auto-profile creation, updated_at maintenance, audit logging,
-- payroll finalization lock. Run AFTER 001 + 002.
-- ============================================================

-- ── Auto-create a profile for every new auth user ────────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, company_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee'),
    nullif(new.raw_user_meta_data ->> 'company_id', '')::int
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── updated_at maintenance ───────────────────────────────────
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists employees_touch on employees;
create trigger employees_touch before update on employees
  for each row execute function touch_updated_at();

drop trigger if exists attendance_touch on attendance_records;
create trigger attendance_touch before update on attendance_records
  for each row execute function touch_updated_at();

drop trigger if exists salary_touch on salary_structures;
create trigger salary_touch before update on salary_structures
  for each row execute function touch_updated_at();

-- ── Audit logging (SECURITY DEFINER: audit table has no write policies) ──
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action text := lower(tg_op);
  v_row jsonb;
  v_entity_id text;
  v_company_id int;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_entity_id := coalesce(v_row ->> 'id', v_row ->> 'emp_code', tg_table_name);
  v_company_id := case
    when tg_table_name = 'companies' then (v_row ->> 'id')::int
    else nullif(v_row ->> 'company_id', '')::int
  end;

  insert into audit_logs (actor_id, actor_label, action, entity, entity_id, details, company_id)
  values (
    auth.uid(),
    coalesce(
      (select role from profiles where id = auth.uid()),
      case when auth.uid() is null then 'system' else 'unknown' end
    ),
    v_action,
    tg_table_name,
    v_entity_id,
    v_row,
    v_company_id
  );
  return coalesce(new, old);
end $$;

drop trigger if exists audit_companies on companies;
create trigger audit_companies after insert or update or delete on companies
  for each row execute function audit_row();
drop trigger if exists audit_holidays on holidays;
create trigger audit_holidays after insert or update or delete on holidays
  for each row execute function audit_row();
drop trigger if exists audit_departments on departments;
create trigger audit_departments after insert or update or delete on departments
  for each row execute function audit_row();
drop trigger if exists audit_designations on designations;
create trigger audit_designations after insert or update or delete on designations
  for each row execute function audit_row();
drop trigger if exists audit_leave_types on leave_types;
create trigger audit_leave_types after insert or update or delete on leave_types
  for each row execute function audit_row();
drop trigger if exists audit_employees on employees;
create trigger audit_employees after insert or update or delete on employees
  for each row execute function audit_row();
drop trigger if exists audit_attendance on attendance_records;
create trigger audit_attendance after insert or update or delete on attendance_records
  for each row execute function audit_row();
drop trigger if exists audit_corrections on attendance_corrections;
create trigger audit_corrections after insert or update or delete on attendance_corrections
  for each row execute function audit_row();
drop trigger if exists audit_leave_requests on leave_requests;
create trigger audit_leave_requests after insert or update or delete on leave_requests
  for each row execute function audit_row();
drop trigger if exists audit_salary on salary_structures;
create trigger audit_salary after insert or update or delete on salary_structures
  for each row execute function audit_row();
drop trigger if exists audit_payroll_runs on payroll_runs;
create trigger audit_payroll_runs after insert or update or delete on payroll_runs
  for each row execute function audit_row();
drop trigger if exists audit_payslips on payslips;
create trigger audit_payslips after insert or update or delete on payslips
  for each row execute function audit_row();
drop trigger if exists audit_announcements on announcements;
create trigger audit_announcements after insert or update or delete on announcements
  for each row execute function audit_row();

-- ── Payroll finalization lock ────────────────────────────────
-- 1) A finalized run is immutable — no updates or deletes, ever.
-- 2) Setting status = 'finalized' requires an active Admin session.
create or replace function guard_payroll_run() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.status = 'finalized' then
    raise exception 'Payroll run % is finalized and locked', old.period_month;
  end if;
  if tg_op = 'UPDATE'
     and new.status = 'finalized'
     and old.status <> 'finalized'
     and not coalesce((select true from profiles where id = auth.uid() and role = 'admin' and is_active), false) then
    raise exception 'Only an Admin can finalize a payroll run';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists guard_payroll_runs on payroll_runs;
create trigger guard_payroll_runs before update or delete on payroll_runs
  for each row execute function guard_payroll_run();

-- Payslips are frozen once their run is finalized.
create or replace function guard_payslip() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_run uuid := coalesce(old.run_id, new.run_id);
  v_finalized boolean;
begin
  select status = 'finalized' into v_finalized from payroll_runs where id = v_run;
  if coalesce(v_finalized, false) then
    raise exception 'Payslip belongs to a finalized payroll run and is locked';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists guard_payslips on payslips;
create trigger guard_payslips before update or delete on payslips
  for each row execute function guard_payslip();
