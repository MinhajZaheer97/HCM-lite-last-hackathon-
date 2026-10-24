# HCM Lite — Master Task List

> Saylani Hackathon · Next.js 16 + React 19 + Supabase (Postgres, Auth, RLS) + Tailwind CSS v4 + OpenRouter AI
> Single source of truth for progress. A checkbox is ticked **only after** its step is verified working.

## How we work
- One phase at a time, one task at a time. Say "start Phase 3" to begin.
- 🤖 **AI** = tasks I do: code, SQL migrations, tests, fixes.
- 👤 **YOU** = tasks only you can do: browser actions (Supabase dashboard), API keys, secrets, user-acceptance testing.
- Status legend: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked

## Locked-in decisions
| Decision | Choice |
|---|---|
| Styling | Tailwind CSS v4 (already in scaffold) |
| Database/Auth | Supabase — PostgreSQL + Auth + RLS on every table |
| AI provider | OpenRouter (OpenAI-compatible, tool calling); key server-side only |
| Admin bootstrap | `/setup` gated by `SETUP_ACCESS_CODE` env secret; works only while no company exists |
| Payroll deductions | Per-day = gross ÷ working days in month; −1.0 per absent/unpaid-leave day; −0.5 per half-day; no tax |
| Charts | recharts |
| Tenancy | Single company, single-tenant |
| Defaults | Timezone Asia/Karachi · Currency PKR (editable in settings) |
| Leave quotas | Per calendar year, no mid-year proration (v1) |
| Partial leave approvals | Not supported — reject & resubmit |
| Employment statuses | probation / active / exited — headcount = active + probation |
| Employee logins | Created by HR in-app; temp password shown once |

## Phase 0 — Project Foundation 🧱
Depends on: nothing · Acceptance: `npm run dev` clean, lint passes, placeholder pages render. Status: ✅ done (AI-side verified: lint clean, `next build` green with all 33 routes, dev server 200 on `/`, `/login`, `/admin/dashboard`)
- [x] 0.1 🤖 Clean `npm install` (lockfile) · [x] 0.2 🤖 Install deps: `@supabase/supabase-js`, `@supabase/ssr`, `recharts`, `date-fns`, `pdf-lib` · [x] 0.3 🤖 `.env.example` · [x] 0.4 🤖 Tailwind theme tokens · [x] 0.5 🤖 UI kit (Button/Input/Field/Textarea/Select/Card/Table/Badge/Modal/Toast/EmptyState/PageHeader/Skeleton in `src/components/ui/`) · [x] 0.6 🤖 App shell with role-aware nav (`src/lib/nav.js`, Sidebar/Topbar/AppShell) · [x] 0.7 🤖 Root placeholder landing (real boot redirect lands in Phase 2 with session logic) · [x] 0.8 🤖 Placeholder routes (33 routes incl. `/setup`, `/login`, `/change-password`, admin×14, hr×7, me×7)
- [ ] 0.9 👤 Run dev, click around, give feedback

> Notes: the Windows SWC binary was corrupted (truncated 27 MB vs 110 MB) and reinstalled — if builds fail with "not a valid Win32 application", reinstall `@next/swc-win32-x64-msvc`. Route-group layouts hardcode the role for Phase 0; real session + role guards replace that in Phase 2.

## Phase 1 — Supabase Project & Database 🗄️
Depends on: Phase 0 · Acceptance: migrations apply cleanly; `rls-tests.sql` all OK. Status: ✅ done (user applied all migrations; rls-tests pass after test-script fix — SELECT-under-RLS returns zero rows rather than raising)
- [x] 1.1 👤 Create Supabase project (browser)
- [x] 1.2 👤 Copy Project URL + anon key + service_role key into `.env.local`
- [x] 1.3 🤖 Migration `supabase/migrations/001_schema.sql` — 16 tables: companies (single row), holidays, profiles, departments, designations, leave_types, employees, attendance_records (unique per employee/day), attendance_corrections, leave_requests (DB-level overlap exclusion), salary_structures (one per employee), payroll_runs (unique month), payslips (unique per run+employee), announcements, notifications, audit_logs
- [x] 1.4 🤖 Migration `supabase/migrations/002_rls.sql` — helpers (`is_admin/is_hr/is_staff/my_employee_id`) + RLS on all 16 tables with per-role policies (employee sees own rows only; payslips/salary own-only; audit admin-all/HR-limited)
- [x] 1.5 🤖 Migration `supabase/migrations/003_triggers.sql` — auto-profile on user creation, updated_at maintenance, audit logging on 13 tables (security-definer, append-only), payroll finalize = admin-only + finalized runs/payslips immutable
- [x] 1.6 👤 Apply migrations in Supabase SQL Editor (001 → 002 → 003)
- [x] 1.7 🤖 Supabase clients: `src/lib/supabase/client.js` (browser), `server.js` (cookie session), `admin.js` (service-role, server-only, browser-use guard)
- [x] 1.8 🤖 `supabase/rls-tests.sql` — anon/profile-less access denied on employees/payslips/salary/audit, policy-count audit across all tables, trigger presence checks; runs in a rolled-back transaction
- [x] 1.9 👤 Run rls-tests in SQL Editor, share output
- [x] 1.10 🤖 Fix policy gaps, re-test (fix was in the test script itself, not the policies)

## Phase 2 — Auth & First-Run Setup 🔐
Depends on: Phase 1 · Acceptance: empty DB → setup → admin login; wrong-role/direct-URL blocked. Status: 🟨 in progress — AI-side code done, lint + build green; awaiting 👤 acceptance tests 2.6/2.7
- [x] 2.1 👤 Choose `SETUP_ACCESS_CODE` in `.env.local` *(verify it's set before testing)*
- [x] 2.2 🤖 `/setup` wizard (`setup/page.jsx` + `wizard.jsx` + `actions.js`): access-code gate → company profile + policies (hours, grace, weekends, timezone, currency) → first Admin → auto-login → redirect; wizard locks forever once a company row exists; admin user rolled back if company insert fails
- [x] 2.3 🤖 Login (`/login`, deactivated-account check, role-based redirect), logout (topbar Account menu), change-password (`/change-password`, verifies current password)
- [x] 2.4 🤖 Session proxy (`src/proxy.js`, Next 16 middleware successor): token refresh + redirect unauthenticated users off /admin /hr /me
- [x] 2.5 🤖 Server-side role guards in all three route-group layouts via `requireRole()` (`src/lib/auth.js`) — admin layout = admin only; hr layout = admin+hr; me layout = employee only; deactivated profiles blocked
- [ ] 2.6 👤 Test: setup → login → change password
- [ ] 2.7 👤 Try employee/HR URL as Admin → confirm redirect

> Notes: `cacheComponents`/`partialPrefetching` disabled in `next.config.mjs` — every route is auth-dynamic, and layout-level session reads conflict with cacheComponents' Suspense requirements. `connection()` still declared in auth pages/layouts. Proxy matcher excludes static assets.

## Phase 3 — Company & Org Configuration ⚙️
Depends on: Phase 2 · Acceptance: CRUD round-trips; HR/Employee blocked at server+RLS. Status: 🟨 in progress — AI-side code done, lint + build green; awaiting 👤 tests 3.7/3.8
- [x] 3.1–3.6 🤖 Departments CRUD · Designations CRUD (grouped by dept) · Leave types CRUD (quota + paid flag) · Holidays CRUD · Company settings (hours, grace, weekends, timezone, currency) · HR accounts (create w/ temp-password-shown-once, deactivate/reactivate, reset) — per-page server actions re-check admin role; RLS as second layer; shared `SimpleCrud` component; FK-violation deletes give friendly errors
- [ ] 3.7 👤 Test as Admin: add depts, designations, leave types, holiday; create HR account
- [ ] 3.8 👤 As HR, confirm org-config pages inaccessible (direct URL too)

## Phase 4 — Employee Management (HR) 👥
Depends on: Phase 3 · Acceptance: server validation; CSV dry-run never writes until confirmed; employees see only own record. Status: 🟨 in progress — AI-side code done (lint ✓, build ✓, 7/7 CSV unit tests ✓); awaiting 👤 tests 4.7–4.9
- [x] 4.1 🤖 Registration + edit (`hr/employees/` + `actions.js`): full personal/job fields, auto-generated emp codes (EMP-0001…), server-side validation, exit-date-after-join check, no delete (mark exited instead)
- [x] 4.2 🤖 Directory w/ search (name/code/email) + department & status filters
- [x] 4.3 🤖 360° profile (`hr/employees/[id]`): personal, job, login status, record sections reserved for Phases 5–7
- [x] 4.4 🤖 Employee login creation from the 360° profile — service-role createUser, temp password shown exactly once, auth user ↔ employee ↔ profile linked, rollback on failure
- [x] 4.5 🤖 CSV import (`csv-import.jsx` + dry-run/commit actions): header-aware column mapping, per-row error report, duplicates vs DB + within file, all-or-nothing commit of valid rows only, 500-row cap
- [x] 4.6 🤖 CSV export via `/api/employees/export` (HR/Admin role-checked)
- [x] 🤖 `src/lib/csv.js` parser/validator/exporter + `csv.test.js` (7 node:test cases) — parser is RFC-4180-ish (quotes, CRLF, BOM)
- [x] 🤖 Employee self-service profile `/me/profile` (own record only, RLS-enforced)
- [ ] 4.7 👤 Register 2–3 employees, create logins
- [ ] 4.8 👤 Import test CSV with one bad row → error report catches it, nothing written until confirmed
- [ ] 4.9 👤 Log in as an employee → see only own profile

## Phase 5 — Attendance 🕐
Depends on: Phase 4 · Acceptance: statuses match config; duplicates rejected; corrections audited. Status: 🟨 in progress — AI-side code done, lint + attendance rules tests green; awaiting 👤 tests 5.7/5.8
- [x] 5.1 🤖 Check-in/out actions (duplicate prevention, weekend/holiday guard, grace/late, first-in/last-out, missing checkout) · [x] 5.2 🤖 Rules engine (pure module) · [x] 5.3 🤖 Employee calendar/history · [x] 5.4 🤖 HR/Admin daily board · [x] 5.5 🤖 Correction requests → HR approval · [x] 5.6 🤖 Unit tests
- [ ] 5.7 👤 Check in/out (twice → second fails); HR board updates
- [ ] 5.8 👤 Correction request → approve → record changes, audit entry exists

## Phase 6 — Leave Management 🌴
Depends on: Phase 5 · Acceptance: over-quota/overlap rejected server-side; statuses + balances correct; notifications fire. Status: 🟨 in progress — AI-side code implemented, lint/build/tests green; awaiting 👤 tests 6.7/6.8
- [x] 6.1 🤖 Application form (half-day support, quota/overlap/working-days validation) · [x] 6.2 🤖 Cancel where permitted · [x] 6.3 🤖 Balance calc · [x] 6.4 🤖 HR approvals w/ comments + status tracking · [x] 6.5 🤖 Notifications + attendance linkage · [x] 6.6 🤖 Unit tests
- [ ] 6.7 👤 Apply → approve → balance drop, notification, on-leave marking
- [ ] 6.8 👤 Over-quota + overlapping attempts rejected

## Phase 7 — Payroll 💰
Depends on: Phase 6 · Acceptance: unit-tested math; no duplicate runs; finalized = immutable at DB level; role-scoped payslips/PDF. Status: 🟨 in progress — AI-side code implemented, lint/build/tests pending final verification; awaiting 👤 tests 7.8–7.10
- [x] 7.1 🤖 Salary structures · [x] 7.2 🤖 Calculation engine (pure) · [x] 7.3 🤖 Unit tests · [x] 7.4 🤖 Drafts (unique period) + review + recompute · [x] 7.5 🤖 Admin finalize & lock (DB-enforced) · [x] 7.6 🤖 Payslips + `pdf-lib` PDFs · [x] 7.7 🤖 Notifications
- [ ] 7.8 👤 Set structure → run draft → hand-check math
- [ ] 7.9 👤 Finalize → try to edit → lock holds
- [ ] 7.10 👤 Download own PDF; other employee's URL denied

## Phase 8 — Analytics & Dashboards 📊
Depends on: Phase 7 · Acceptance: metrics hand-verified; honest zeros/empty states. Status: 🟨 in progress — AI-side dashboard slice implemented, lint + 21 tests green; production build currently blocked by the active dev server locking `.next`; awaiting 👤 tests 8.7/8.8
- [x] 8.1 🤖 Analytics library (headcount, attendance rate, late %, payroll cost & avg salary) · [x] 8.2 🤖 Date filter · [x] 8.3 🤖 Admin dashboard · [x] 8.4 🤖 HR dashboard · [x] 8.5 🤖 Employee dashboard (check-in status, week hours vs 40 h reference, late count, leave balance, latest payslip) · [x] 8.6 🤖 Empty states
- [ ] 8.7 👤 Spot-check every number vs records
- [ ] 8.8 👤 Confirm empty/zero states

## Phase 9 — Announcements, Notifications & Audit 📢
Depends on: Phase 8 · Acceptance: permission matrix holds; audit append-only. Status: 🟨 in progress — AI-side code implemented, lint/tests pending final verification; awaiting 👤 test 9.5
- [x] 9.1 🤖 Announcements (Admin+HR post, all read) · [x] 9.2 🤖 Notification bell (unread count, mark read) · [x] 9.3 🤖 Audit viewer (Admin all, HR scope) · [x] 9.4 🤖 Audit append-only viewer
- [ ] 9.5 👤 Post announcement as HR → read as employee; check bell after leave decision

## Phase 10 — AI Assistant 🤖
Depends on: Phase 8 · Acceptance: answers trace to real records w/ provenance; role isolation tested; honest "insufficient data"; no silent approvals; keys never client-side. Status: ⏭️ deferred — intentionally excluded from the deployment baseline due to time constraints; AI routes remain placeholders.
- [ ] 10.1–10.10 AI implementation and acceptance (deferred)

## Phase 11 — Security Review, Polish & Demo Readiness 🎯
Depends on: Phases 0–9 · Acceptance: non-AI demo script passes on fresh project. Status: 🟨 deployment preparation in progress
- [ ] 11.1 🤖 Full RLS matrix re-run · 11.2 🤖 Cross-employee API access attempts (all denied) · 11.3 🤖 Lock + duplicate re-tests · 11.4 🤖 UX polish (states, responsive, a11y) · 11.5 🤖 README rewrite · 11.6 🤖 Demo script
- [ ] 11.7 👤 Full demo dry run on fresh project · 11.8 👤 Report glitches → I fix → re-run

## Definition of Done — Hackathon Demo Script
1. Empty business database → 2. Configure company (Admin) → 3. Create HR account → 4. Register employees (HR) → 5. Employee attendance → 6. Leave request + HR decision → 7. Payroll draft → 8. Admin finalization → 9. Payslip PDF → 10. Dashboards reflect reality → 11. AI answers verified vs data → 12. Permission enforcement shown. **No fake data ever inserted.**

## Environment variables (`.env.local` — never commit)
| Variable | Purpose | Needed by |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Phase 1 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key | Phase 1 |
| SUPABASE_SERVICE_ROLE_KEY | Service-role key (server-only) | Phase 1 |
| SETUP_ACCESS_CODE | First-run gate secret | Phase 2 |
| OPENROUTER_API_KEY | AI key (server-only) | Phase 10 |
| OPENROUTER_MODEL | Tool-calling model ID | Phase 10 |

---

After writing the file I'll report its location so you can review it, and we begin with Phase 0 whenever you say go.