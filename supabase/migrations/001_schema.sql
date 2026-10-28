-- ============================================================
-- HCM Lite — 001_schema.sql
-- Tables, constraints, indexes. Run BEFORE 002_rls.sql and 003_triggers.sql.
-- ============================================================

-- Needed for the leave-overlap exclusion constraint.
create extension if not exists btree_gist;

-- ── Company (tenant root; supports multiple companies) ─────
create table if not exists companies (
  id int generated always as identity primary key,
  name text not null,
  address text,
  office_location text,
  timezone text not null default 'Asia/Karachi',
  currency text not null default 'PKR',
  office_start time not null default '09:00',
  office_end time not null default '17:00',
  grace_minutes int not null default 10 check (grace_minutes between 0 and 120),
  -- 0=Sunday … 6=Saturday (JS Date.getDay() convention)
  weekend_days int[] not null default '{0,6}',
  setup_completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Public holidays ──────────────────────────────────────────
create table if not exists holidays (
  id int generated always as identity primary key,
  holiday_date date not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- ── Profiles (identity + role; id = auth.users.id) ───────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employee' check (role in ('admin', 'hr', 'employee')),
  employee_id uuid, -- FK added after employees table exists (see below)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Org structure ────────────────────────────────────────────
create table if not exists departments (
  id int generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists designations (
  id int generated always as identity primary key,
  name text not null,
  department_id int references departments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique nulls not distinct (name, department_id)
);

-- ── Leave policy ─────────────────────────────────────────────
create table if not exists leave_types (
  id int generated always as identity primary key,
  name text not null unique,
  annual_days numeric(4,1) not null check (annual_days > 0),
  is_paid boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Employees ────────────────────────────────────────────────
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  emp_code text not null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  gender text check (gender in ('male', 'female', 'other')),
  dob date,
  address text,
  department_id int references departments(id) on delete set null,
  designation_id int references designations(id) on delete set null,
  join_date date not null,
  exit_date date,
  status text not null default 'probation'
    check (status in ('probation', 'active', 'exited')),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exit_after_join check (exit_date is null or exit_date >= join_date)
);

alter table profiles
  add constraint profiles_employee_id_fkey
  foreign key (employee_id) references employees(id) on delete set null;

-- ── Attendance ───────────────────────────────────────────────
-- One record per employee per work day; the unique constraint is the
-- duplicate-action guard at the database level.
create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  work_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text not null
    check (status in ('present', 'late', 'half_day', 'missing_checkout', 'on_leave', 'absent')),
  worked_minutes int check (worked_minutes >= 0),
  source text not null default 'web' check (source in ('web', 'correction', 'system')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date),
  constraint check_order check (check_out is null or check_in is null or check_out > check_in)
);
create index if not exists attendance_records_work_date_idx on attendance_records (work_date);

create table if not exists attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references attendance_records(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  requested jsonb not null, -- { check_in?, check_out?, status? }
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id) on delete set null,
  review_comment text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Leave requests ───────────────────────────────────────────
-- The partial exclusion constraint rejects overlapping pending/approved
-- requests per employee at the database level.
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type_id int not null references leave_types(id),
  start_date date not null,
  end_date date not null,
  days numeric(4,1) not null check (days > 0),
  is_half_day boolean not null default false,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by uuid references profiles(id) on delete set null,
  decision_comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint leave_date_order check (end_date >= start_date),
  constraint no_overlapping_leave exclude using gist (
    employee_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status in ('pending', 'approved'))
);
create index if not exists leave_requests_employee_idx on leave_requests (employee_id);
create index if not exists leave_requests_status_idx on leave_requests (status);

-- ── Salary structures (one current structure per employee) ───
create table if not exists salary_structures (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references employees(id) on delete cascade,
  basic numeric(12,2) not null check (basic >= 0),
  allowances jsonb not null default '{}' -- { "label": amount, ... }
    check (jsonb_typeof(allowances) = 'object'),
  effective_from date not null,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Payroll ──────────────────────────────────────────────────
-- Unique period_month prevents duplicate runs for the same month.
create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_month date not null unique check (extract(day from period_month) = 1),
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  drafted_by uuid references profiles(id) on delete set null,
  drafted_at timestamptz not null default now(),
  finalized_by uuid references profiles(id) on delete set null,
  finalized_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists payslips (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  gross numeric(12,2) not null default 0,
  total_deductions numeric(12,2) not null default 0,
  net numeric(12,2) not null default 0,
  deduction_items jsonb not null default '[]', -- [{ label, days, amount }]
  days_worked numeric(5,1) not null default 0,
  lop_days numeric(5,1) not null default 0, -- loss-of-pay days
  unique (run_id, employee_id)
);
create index if not exists payslips_employee_idx on payslips (employee_id);

-- ── Announcements & notifications ────────────────────────────
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  posted_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null, -- e.g. leave_decision, payslip_available, announcement
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_profile_idx on notifications (profile_id, created_at desc);

-- ── Audit log (append-only; policies in 002, triggers in 003) ─
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_label text,
  action text not null,        -- insert | update | delete | finalize | …
  entity text not null,        -- table name
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
