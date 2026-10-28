# HCM Lite

HCM Lite is a multi-company human capital management platform built with **Next.js**, **Supabase**, and **Tailwind CSS**. Each company has its own administrator, employees, settings, attendance, leave, payroll, announcements, notifications, and audit history.

## Features

- Multi-company tenant isolation with Supabase RLS
- Company admin onboarding without a deployment-wide access code
- Admin, HR, and employee roles
- Employee directory and login creation
- Attendance check-in, checkout, corrections, holidays, and company schedules
- Leave requests, approvals, balances, and attendance linkage
- Salary structures, payroll drafts, finalization, and payslip PDFs
- Announcements, notifications, and audit logs
- CSV employee import/export
- Company-scoped departments, designations, leave types, holidays, and payroll

The AI routes are placeholders. OpenRouter configuration is reserved for a future phase.

## Requirements

- Node.js 20.9 or newer
- A Supabase project
- PowerShell on Windows, or an equivalent shell on macOS/Linux

## Local development

Install dependencies and create the local environment file:

```powershell
npm.cmd install
Copy-Item .env.example .env.local
```

Add your Supabase credentials to `.env.local`, then start the app:

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). New company administrators create their company and account at `/setup` using their email and password.

On Windows, use `npm.cmd` if PowerShell blocks the `npm` script.

## Environment variables

Required:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public browser/SSR key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key |

Optional:

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | Reserved for the future AI assistant |
| `OPENROUTER_MODEL` | Reserved AI model name |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public and may be exposed in the browser bundle. In Netlify, mark it as **Plain text**, not Secret. Keep `SUPABASE_SERVICE_ROLE_KEY` private and server-only. Never commit `.env.local` or share credentials.

## Database setup

Run the migrations in the Supabase SQL Editor in this order:

1. `001_schema.sql`
2. `002_rls.sql`
3. `003_triggers.sql`
4. `004_employee_payroll_access.sql`
5. `005_add_company_scope.sql`
6. `006_backfill_default_company.sql`
7. `007_single_company_admin_policy.sql`
8. `008_multi_company_setup.sql`
9. `009_fix_company_admin_signup.sql`
10. `010_company_isolation_rls.sql`
11. `011_company_employee_code.sql`
12. `012_company_scoped_unique_constraints.sql`
13. `013_employee_payroll_visibility.sql`
14. `014_employee_checkout_rls.sql`

For an existing database, do not skip migrations. The later migrations repair and harden the original single-company schema:

- `009` fixes company-first admin signup.
- `010` enforces company data isolation and scopes holidays.
- `011` makes employee codes unique per company.
- `012` scopes organization and payroll uniqueness per company.
- `013` lets employees view their finalized payroll run.
- `014` lets employees check out their own attendance record.

After migration `006`, run:

```text
supabase/multi-company-backfill-validation.sql
```

After migration `010`, use this validation script while signed in as admins from different companies:

```text
supabase/multi-company-isolation-validation.sql
```

Each admin should see only their own company and company-owned records.

## Company and role model

| Role | Scope |
|---|---|
| Admin | Full access to their own company |
| HR | Employee, attendance, leave, and payroll operations within their company |
| Employee | Their own profile, attendance, leave, notifications, and finalized payslips |

Company boundaries are enforced in both application code and PostgreSQL RLS. A user from Company A must not be able to read or modify Company B records by changing a URL, ID, or request payload.

## Payroll flow

1. HR or Admin creates salary structures.
2. HR or Admin generates a monthly draft.
3. The draft calculates working days, attendance, approved leave, unpaid leave, deductions, and net pay.
4. Admin reviews and finalizes the draft.
5. Finalized payslips become immediately visible to employees.
6. Employees can download their finalized payslip PDF.

Payroll is company-scoped, and finalized payroll records are locked.

## Netlify deployment

1. Push the repository to GitHub.
2. Import the repository into Netlify.
3. Keep the repository root as the base directory.
4. Add the required environment variables in Netlify.
5. Mark `NEXT_PUBLIC_SUPABASE_ANON_KEY` as **Plain text**.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` as a private Secret.
7. Deploy the site.
8. Run all Supabase migrations before testing the application.
9. Open the deployed `/setup` route to create the first company.

The repository uses `netlify.toml` and builds with:

```text
npm run build
```

## Validation commands

```powershell
npm.cmd run lint
node --test "src/**/*.test.js"
npm.cmd run build
```

The test suite covers attendance rules, payroll calculations, leave rules, analytics, and CSV processing.

## Project structure

```text
src/app/                 Next.js routes, pages, and server actions
src/components/          Reusable UI components
src/lib/                 Auth, Supabase, attendance, leave, payroll, and utilities
supabase/migrations/     Database schema, RLS, triggers, and tenant migrations
supabase/*.sql           Validation and RLS test scripts
```

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Never commit `.env.local`.
- Run every migration in order.
- Test two separate companies before production use.
- Rotate any Supabase key that has been accidentally shared.
