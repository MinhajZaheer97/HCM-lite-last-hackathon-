# HCM Lite — Full Implementation Plan

## Confirmed decisions
- **AI**: OpenRouter (user supplies `OPENROUTER_API_KEY`; model set via `OPENROUTER_MODEL`, must support tool calling). Plain `fetch` to the OpenAI-compatible endpoint — no SDK.
- **Bootstrap**: `/setup` allows a new company admin to create a company with their email and password.
- **Payroll**: per-day salary = gross ÷ working days in that month (company calendar); deduct 1.0 day per absent/unpaid-leave day, 0.5 per half-day; itemized deductions on payslip; **no tax** (none specified — not invented).
- **Charts**: recharts. **Styling**: Tailwind v4 (already configured in scaffold — extend `@theme` tokens in `globals.css`).
- Assumptions documented in-app: single company (single-tenant); company timezone default `Asia/Karachi` + currency default `PKR` (both settings); employment statuses `probation | active | exited` (headcount = active + probation); leave quotas per calendar year, no mid-year proration; partial leave approvals NOT supported (reject & resubmit); 40 h/week shown as fixed reference next to company schedule.

## Dependencies to add (each justified, nothing else)
`@supabase/supabase-js` + `@supabase/ssr` (DB/auth), `recharts` (dashboards), `date-fns` (working-day/date math), `pdf-lib` (payslip PDFs — pure JS, Next-friendly). No UI framework, no state library, no icon lib (inline SVG).

## Architecture
- Next.js 16 App Router, **JavaScript only** (`@/*` → `src/*`). Route groups: `/setup`, `/login`, `/change-password`, `/(admin)/admin/*`, `/(hr)/hr/*`, `/(me)/me/*`.
- Auth session refresh + coarse role routing in Next 16 request middleware (`proxy.ts`); **authoritative** role checks in server layouts, Server Actions, and RLS — never just hidden UI.
- All mutations via Server Actions / route handlers with server-side validation. Privileged ops (employee login creation, payroll finalize) run through a server-only service-role client.
- Business logic as pure JS modules → unit-testable with `node:test`. `src/lib/analytics/*` is the single metrics source used by **both dashboards and AI tools** (no conflicting numbers).
- Design system: Tailwind v4 theme tokens + `src/components/ui/*` (Button, Input, Select, Card, Table, Badge, Modal, Toast, EmptyState, PageHeader, Skeleton) + app shell with role-aware sidebar/topbar/notification bell.

## Database (Supabase Postgres) — `supabase/migrations/*.sql`
RLS on **every** table; append-only audit via triggers:
- `companies` (tenant rows: name, address, timezone, currency, office_start/end, grace_minutes, weekend_days[], setup_completed_at)
- `holidays` (date unique, name)
- `profiles` (id = auth.users.id, full_name, role `admin|hr|employee`, employee_id, is_active)
- `departments` (name unique per company), `designations` (name, department_id nullable, unique per company)
- `employees` (emp_code unique per company, name, email unique, phone, gender, dob, address, dept, designation, join_date required, exit_date, status, created_by)
- `leave_types` (name unique per company, annual_days, is_paid)
- `attendance_records` (unique(employee_id, work_date); check_in/out timestamps; status `present|late|half_day|missing_checkout|on_leave`; worked_minutes; source `web|correction`)
- `attendance_corrections` (record_id, requested JSONB, reason, status, reviewed_by/comment/at)
- `leave_requests` (leave_type, start/end, days numeric(3,1) — supports 0.5 half-day, reason, status `pending|approved|rejected|cancelled`, approver, decision comment, decided_at; DB constraint: no overlapping pending/approved per employee)
- `salary_structures` (basic, allowances JSONB, effective_from, one current per employee)
- `payroll_runs` (period month unique per company → duplicate-run prevention; status `draft|finalized`; finalized_by/at)
- `payslips` (unique(run_id, employee_id); gross, deduction_items JSONB, net, days_worked, lop_days; **immutable once run finalized** — enforced by trigger + RLS)
- `announcements`, `notifications` (profile_id, type, title, link, read_at)
- `audit_logs` (actor, action, entity, details JSONB; insert-only — no update/delete policies)
- SQL helpers: `working_days(month)` (company config − holidays), RLS helpers `is_admin()/is_hr()/my_employee_id()`; e.g. employees readable by admin/hr + own row by employee; payslips/salary: employee sees **own only**; audit: admin read-all, HR limited.

## Folder structure
`src/app` (routes above + `api/ai/chat|summary|leave-prefill`, `api/payslips/[id]/pdf`), `src/components/{ui,layout,charts,features}`, `src/lib/{supabase,auth,analytics,attendance,leave,payroll,ai,csv,dates,audit,notifications}`, colocated `*.test.js`, `supabase/migrations` + `supabase/rls-tests.sql`, `HCM_LITE_PLAN.md`, `.env.example`, README rewrite.

## Metric formulas (documented in code + UI)
- Headcount(date) = status in (active, probation) AND join_date ≤ date AND (exit_date IS NULL OR exit_date ≥ date).
- Attrition(period) = exits in period ÷ ((headcount@start + headcount@end)/2) × 100; rehire = exit counted once + new hire; join_date mandatory.
- Attendance rate = (present + late + missing_checkout + 0.5×half_day) ÷ (eligible working-day records − full-day on-leave) × 100; eligible = active/probation employees × working days within employment window.
- Late% (dept) = late ÷ (present+late+half_day+missing_checkout+absent); absenteeism = absent ÷ same denominator — our explicit documented definitions.
- Leave utilization = approved working-day leave ÷ quota, by type/department.
- Payroll cost/avg salary from finalized runs only (drafts clearly labeled); gross/deductions/net kept distinct.

## Phases (implement → verify acceptance → update HCM_LITE_PLAN.md)
0. **Foundation**: clean `npm install` (repair node_modules, generate lockfile), add deps, `.env.example`, Tailwind theme + UI kit, app shell + placeholder pages, root redirect (setup/login/dashboard), create `HCM_LITE_PLAN.md`. *Accept: dev server clean, lint passes.*
1. **Database**: migrations (schema → RLS → triggers), Supabase clients (browser/server/admin). *Accept: SQL applies cleanly; `rls-tests.sql` all pass.*
2. **Auth & setup**: `/setup` wizard (company + first admin), login/logout/change-password, session middleware, role guards. *Accept: setup → admin login; wrong-role/direct-URL blocked.*
3. **Org config (Admin)**: departments, designations, leave types, holidays CRUD; company settings; HR account create/deactivate/reset. *Accept: CRUD round-trips; HR blocked at server + RLS.*
4. **Employees (HR)**: register/edit, directory with search/filters, 360° view, employee login creation (service-role, temp password shown once), CSV import dry-run + error report + confirmed commit, CSV export. *Accept: invalid rows rejected pre-commit, no partial writes; employee sees own record only.*
5. **Attendance**: check-in/out (company timezone, grace/late, weekend/holiday guard, duplicate prevention), statuses incl. missing-checkout/half-day, my calendar/history, HR daily board, correction request → HR approval. *Accept: statuses match config; weekend blocked; duplicates rejected; corrections audited.*
6. **Leave**: apply/cancel, quota + overlap validation, balances, HR approve/reject with comment, notifications, on_leave linkage to attendance. *Accept: over-quota rejected server-side; all four statuses tracked; notification fired.*
7. **Payroll**: salary structures, monthly draft (unique period), calculation module (confirmed formula) with unit tests, review + recompute, Admin finalize & lock, payslips, PDF via pdf-lib, notifications. *Accept: `node:test` green; finalized run immutable at DB level; payslip/PDF role-scoped.*
8. **Analytics & dashboards**: analytics lib, filters (date range, department), Admin/HR/Employee dashboards with recharts, honest empty states. *Accept: metrics hand-verified against demo records; zeros on empty DB.*
9. **Announcements / notifications / audit UI**: post/read per matrix, bell + read state, audit viewer. *Accept: matrix enforced; audit append-only.*
10. **AI assistant**: OpenRouter client, role-scoped tools over analytics/lib (company-wide for Admin, HR-scope, own-data for Employee), chat UI, dashboard summaries ("insufficient data" honesty), smart-leave pre-fill with ambiguity follow-ups (never silent approval), policy Q&A grounded in settings. *Accept: role isolation tested; no-key/no-data graceful; keys never client-side.*
11. **Security review & demo**: full RLS matrix, cross-employee access attempts, lock retests, UX polish, README, dry-run of the spec §12 demo script on fresh data. *Accept: every demo step passes.*

## Human tasks (I'll prompt when needed)
1. Create Supabase project → paste Project URL + anon key + service-role key into `.env.local`.
2. Run migrations (paste SQL into Supabase SQL Editor, or install Supabase CLI and I run them).
3. Provide OpenRouter API key + choose a tool-calling model.

## Testing strategy
Unit (`node:test`): payroll calc, attendance rules, working days, leave balance, CSV validation. Per-phase manual/scripted acceptance checks. `supabase/rls-tests.sql` after Phase 1 and again in Phase 11. Final: full spec §12 demo walkthrough on a fresh project. `HCM_LITE_PLAN.md` status updates only after acceptance checks actually pass.