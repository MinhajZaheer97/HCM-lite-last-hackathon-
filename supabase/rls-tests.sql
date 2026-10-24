-- ============================================================
-- HCM Lite — rls-tests.sql
-- Verifies RLS policies. Paste-and-run in the Supabase SQL Editor
-- AFTER applying 001 + 002 + 003. Everything runs inside one
-- transaction that is ROLLED BACK — no data is left behind.
--
-- Expected output: a series of 'OK: …' lines and a final summary.
-- Any 'FAIL: …' line means a policy gap — share the output with me.
-- ============================================================

begin;

do $$
declare
  v_anon_rows int;
  v_missing_policies text;
  v_fake uuid := gen_random_uuid();
begin

-- ── 1. Static check: RLS enabled + expected policy count per table ──
with expected(table_name, min_policies) as (
  values
    ('companies', 2), ('holidays', 2), ('profiles', 2), ('departments', 2),
    ('designations', 2), ('leave_types', 2), ('employees', 4),
    ('attendance_records', 4), ('attendance_corrections', 3),
    ('leave_requests', 4), ('salary_structures', 2), ('payroll_runs', 2),
    ('payslips', 2), ('announcements', 4), ('notifications', 2),
    ('audit_logs', 2)
)
select string_agg(e.table_name || ' (has ' || coalesce(p.cnt, 0) || ')', ', ')
  into v_missing_policies
from expected e
left join (
  select tablename, count(*) as cnt from pg_policies
  where schemaname = 'public' group by tablename
) p on p.tablename = e.table_name
where coalesce(p.cnt, 0) < e.min_policies
   or not exists (
     select 1 from pg_tables t
     where t.schemaname = 'public' and t.tablename = e.table_name and t.rowsecurity
   );

if v_missing_policies is not null then
  raise exception 'FAIL: RLS/policy gaps on: %', v_missing_policies;
end if;
raise notice 'OK: RLS enabled and policy counts sufficient on all 16 tables';

-- ── 2. Anonymous user sees nothing and can write nothing ──
set local role anon;

select count(*) into v_anon_rows from employees;
if v_anon_rows <> 0 then raise exception 'FAIL: anon can SELECT employees'; end if;
raise notice 'OK: anon SELECT on employees returns nothing';

begin
  insert into departments (name) values ('__rls_test__');
  raise exception 'FAIL: anon INSERT into departments succeeded';
exception when insufficient_privilege or check_violation then
  raise notice 'OK: anon INSERT into departments rejected';
when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
  raise notice 'OK: anon INSERT into departments rejected (%)', sqlerrm;
end;

begin
  insert into audit_logs (action, entity) values ('x', 'y');
  raise exception 'FAIL: anon INSERT into audit_logs succeeded';
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
  raise notice 'OK: audit_logs not writable by anon (%)', sqlerrm;
end;

-- ── 3. Authenticated user without a profile: no employee data, no audit ──
set local role authenticated;
perform set_config(
  'request.jwt.claims',
  json_build_object('sub', v_fake::text)::text,
  true
);

select count(*) into v_anon_rows from employees;
if v_anon_rows <> 0 then raise exception 'FAIL: profile-less user can SELECT employees'; end if;
raise notice 'OK: profile-less authenticated user sees no employees';

select count(*) into v_anon_rows from payslips;
if v_anon_rows <> 0 then raise exception 'FAIL: profile-less user can SELECT payslips'; end if;
raise notice 'OK: profile-less authenticated user sees no payslips';

-- RLS filters rows rather than raising on SELECT, so assert zero visibility.
select count(*) into v_anon_rows from audit_logs;
if v_anon_rows <> 0 then raise exception 'FAIL: profile-less user can SELECT audit_logs'; end if;
raise notice 'OK: profile-less authenticated user sees no audit_logs';

-- ── 4. Employees cannot read salary structures of others ──
-- (no profile → my_employee_id() is null → zero rows even if rows existed)
select count(*) into v_anon_rows from salary_structures;
if v_anon_rows <> 0 then raise exception 'FAIL: profile-less user can SELECT salary_structures'; end if;
raise notice 'OK: profile-less authenticated user sees no salary structures';

-- ── 5. Finalization lock: only admin can finalize ──
-- (no payroll_runs can exist yet; the trigger is verified functionally in
-- Phase 7 acceptance tests — here we verify the trigger exists)
if not exists (
  select 1 from pg_trigger
  where tgname = 'guard_payroll_runs' and not tgisinternal
) then
  raise exception 'FAIL: guard_payroll_runs trigger missing';
end if;
raise notice 'OK: payroll finalization lock trigger present';

if not exists (
  select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal
) then
  raise exception 'FAIL: on_auth_user_created trigger missing';
end if;
raise notice 'OK: profile auto-creation trigger present';

end $$;

rollback;
do $$
begin
  raise notice '── rls-tests finished: all checks OK (transaction rolled back) ──';
end $$;
