-- ============================================================
-- HCM Lite — 002_rls.sql
-- Helper functions + Row Level Security on EVERY business table.
-- Run AFTER 001_schema.sql, BEFORE 003_triggers.sql.
-- ============================================================

-- ── Helper functions (security definer so RLS policies can call them
--    without recursion) ─────────────────────────────────────────
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function is_hr() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'hr' and is_active
  );
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or is_hr();
$$;

create or replace function my_employee_id() returns uuid
language sql stable security definer set search_path = public as $$
  select employee_id from profiles where id = auth.uid() and is_active;
$$;

-- ── Enable RLS everywhere ────────────────────────────────────
alter table companies             enable row level security;
alter table holidays              enable row level security;
alter table profiles              enable row level security;
alter table departments           enable row level security;
alter table designations          enable row level security;
alter table leave_types           enable row level security;
alter table employees             enable row level security;
alter table attendance_records    enable row level security;
alter table attendance_corrections enable row level security;
alter table leave_requests        enable row level security;
alter table salary_structures     enable row level security;
alter table payroll_runs          enable row level security;
alter table payslips              enable row level security;
alter table announcements         enable row level security;
alter table notifications         enable row level security;
alter table audit_logs            enable row level security;

-- ── companies ────────────────────────────────────────────────
-- Created only by the setup wizard via the service-role client.
create policy companies_select on companies
  for select to authenticated using (true);
create policy companies_update on companies
  for update to authenticated using (is_admin());

-- ── Reference data: holidays, departments, designations, leave_types ──
create policy holidays_select on holidays
  for select to authenticated using (true);
create policy holidays_write on holidays
  for all to authenticated using (is_admin()) with check (is_admin());

create policy departments_select on departments
  for select to authenticated using (true);
create policy departments_write on departments
  for all to authenticated using (is_admin()) with check (is_admin());

create policy designations_select on designations
  for select to authenticated using (true);
create policy designations_write on designations
  for all to authenticated using (is_admin()) with check (is_admin());

create policy leave_types_select on leave_types
  for select to authenticated using (true);
create policy leave_types_write on leave_types
  for all to authenticated using (is_admin()) with check (is_admin());

-- ── profiles ─────────────────────────────────────────────────
create policy profiles_select on profiles
  for select to authenticated
  using (id = auth.uid() or is_staff());
-- Users may edit their own profile fields (server actions validate which);
-- creation happens via the auth trigger / service role only.
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ── employees ────────────────────────────────────────────────
create policy employees_select on employees
  for select to authenticated
  using (is_staff() or id = my_employee_id());
create policy employees_insert on employees
  for insert to authenticated with check (is_staff());
create policy employees_update on employees
  for update to authenticated
  using (is_staff()) with check (is_staff());
create policy employees_delete on employees
  for delete to authenticated using (is_admin());

-- ── attendance_records ───────────────────────────────────────
create policy attendance_select on attendance_records
  for select to authenticated
  using (is_staff() or employee_id = my_employee_id());
-- Employees insert only their own check-in record (server enforces status
-- computation and the weekend/holiday guards).
create policy attendance_insert on attendance_records
  for insert to authenticated
  with check (is_staff() or employee_id = my_employee_id());
create policy attendance_update on attendance_records
  for update to authenticated
  using (is_staff()) with check (is_staff());
create policy attendance_delete on attendance_records
  for delete to authenticated using (is_admin());

-- ── attendance_corrections ───────────────────────────────────
create policy corrections_select on attendance_corrections
  for select to authenticated
  using (is_staff() or employee_id = my_employee_id());
create policy corrections_insert on attendance_corrections
  for insert to authenticated
  with check (employee_id = my_employee_id());
create policy corrections_update on attendance_corrections
  for update to authenticated
  using (is_staff()) with check (is_staff());

-- ── leave_requests ───────────────────────────────────────────
create policy leave_select on leave_requests
  for select to authenticated
  using (is_staff() or employee_id = my_employee_id());
create policy leave_insert on leave_requests
  for insert to authenticated
  with check (is_staff() or employee_id = my_employee_id());
-- Employees may only cancel their own still-pending requests; staff decide.
create policy leave_update_own_cancel on leave_requests
  for update to authenticated
  using (employee_id = my_employee_id() and status = 'pending')
  with check (employee_id = my_employee_id() and status = 'cancelled');
create policy leave_update_staff on leave_requests
  for update to authenticated
  using (is_staff()) with check (is_staff());

-- ── salary_structures ────────────────────────────────────────
create policy salary_select on salary_structures
  for select to authenticated
  using (is_staff() or employee_id = my_employee_id());
create policy salary_write on salary_structures
  for all to authenticated using (is_staff()) with check (is_staff());

-- ── payroll_runs ─────────────────────────────────────────────
create policy payroll_select on payroll_runs
  for select to authenticated using (is_staff());
create policy payroll_write on payroll_runs
  for all to authenticated using (is_staff()) with check (is_staff());
-- NOTE: only an Admin may set status = 'finalized' — enforced by the
-- trigger in 003_triggers.sql (RLS cannot compare OLD/NEW).

-- ── payslips ─────────────────────────────────────────────────
create policy payslips_select on payslips
  for select to authenticated
  using (is_staff() or employee_id = my_employee_id());
create policy payslips_write on payslips
  for all to authenticated using (is_staff()) with check (is_staff());
-- Immutability after finalization enforced by trigger in 003.

-- ── announcements ────────────────────────────────────────────
create policy announcements_select on announcements
  for select to authenticated using (true);
create policy announcements_insert on announcements
  for insert to authenticated with check (is_staff());
create policy announcements_admin_modify on announcements
  for update to authenticated using (is_admin()) with check (is_admin());
create policy announcements_admin_delete on announcements
  for delete to authenticated using (is_admin());

-- ── notifications ────────────────────────────────────────────
-- Created by the system (service role); users read + mark their own read.
create policy notifications_select_own on notifications
  for select to authenticated using (profile_id = auth.uid());
create policy notifications_update_own on notifications
  for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ── audit_logs ───────────────────────────────────────────────
-- Admin sees everything; HR sees people-process entities only.
-- No insert/update/delete policies: writes happen exclusively through
-- the SECURITY DEFINER audit trigger; nothing is modifiable by roles.
create policy audit_select_admin on audit_logs
  for select to authenticated using (is_admin());
create policy audit_select_hr_limited on audit_logs
  for select to authenticated
  using (
    is_hr() and entity in (
      'employees', 'leave_requests', 'attendance_records', 'attendance_corrections'
    )
  );
