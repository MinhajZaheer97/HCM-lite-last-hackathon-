# HCM Lite

HCM Lite is a single-company human capital management app built with Next.js, Supabase, and Tailwind CSS. The deployment baseline includes authentication, first-run company setup, employee management, attendance, leave, payroll, payslip PDFs, dashboards, announcements, notifications, and audit logs.

The AI assistant routes remain visible as placeholders but are intentionally not part of this deployment. OpenRouter variables are optional unless the AI phase is implemented later.

## Local development

Requirements: Node.js 20.9 or newer and a Supabase project.

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open `http://localhost:3000`. On a fresh database, `/setup` creates the company and first Admin account.

## Environment variables

Required:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser/SSR key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged operations |
| `SETUP_ACCESS_CODE` | Secret required by the first-run setup wizard |

Optional and currently unused:

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Reserved for the deferred AI phase |
| `OPENROUTER_MODEL` | Reserved for the deferred AI phase |

Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`, `SETUP_ACCESS_CODE`, or any API key.

## Supabase setup

Run these files in the Supabase SQL Editor in order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_triggers.sql`

The migrations create the schema, RLS policies, audit triggers, attendance/leave constraints, and payroll finalization locks. `supabase/rls-tests.sql` can be run afterward to verify the main access boundaries.

## Netlify deployment

1. Push this repository to GitHub.
2. In Netlify, choose **Add new project → Import an existing project** and select the repository.
3. Keep the repository root as the base directory. Netlify reads `netlify.toml` and uses `npm run build`.
4. Add the required environment variables in **Site configuration → Environment variables** for every deploy context.
5. Deploy the site.
6. Open the deployed URL and complete `/setup` using the configured `SETUP_ACCESS_CODE`.
7. Apply the Supabase migrations before using the application.

Netlify must have access to the public Supabase variables at build/runtime and the service-role key only in server-side environment variables. Do not put secrets in `NEXT_PUBLIC_*` variables.

## Validation

```powershell
npm.cmd run lint
$tests = Get-ChildItem -Path src -Recurse -Filter *.test.js | ForEach-Object { $_.FullName }
node.exe --test $tests
npm.cmd run build
```

## Current scope

The non-AI application is the deployment target. The remaining manual acceptance work is to verify the Phase 4–9 flows against the real Supabase project, especially role isolation, payroll locking, PDF access, notifications, and audit visibility.
