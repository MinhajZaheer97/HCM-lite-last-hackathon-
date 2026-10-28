# Multiple company setup plan

## Objective
Allow the system to support multiple companies in a single deployment while enforcing one active admin per company and keeping all data isolated by company.

## Current blockers
- The setup flow currently rejects any new company creation as soon as one company row exists in `companies`.
- The setup page previously required a deployment-wide access code, which is not appropriate for self-service company onboarding.
- The app is designed around a global, single-company model instead of per-company ownership.
- The database has additive company-scoping columns but the app still assumes one company is active for the entire deployment.

## Required target behavior
- Multiple companies can exist in the same app instance.
- Each company has exactly one active admin.
- A newly created admin can create their own company without needing the existing app to be globally single-company.
- Admin, HR, and employee roles are enforced within the selected company context.
- No company can access data from another company.

## Proposed implementation plan

### 1. Update the setup flow
- Remove the global “setup is already completed” lock and deployment-wide access-code requirement.
- Allow `/setup` to open for unauthenticated users even when other companies already exist.
- Keep the setup page restricted for signed-in users who already belong to a company.

### 2. Strengthen company-aware auth
- Keep using `company_id` as the tenant boundary.
- Ensure `getCurrentProfile()` and server-side guards validate that the user is in the correct company before allowing CRUD actions.
- Continue enforcing admin/HR/employee role permissions inside the company scope.

### 3. Enforce one admin per company
- Keep the active-admin uniqueness rule in the database through `profiles(company_id, role, is_active)` checks.
- Add validation during company creation and admin assignment so one company cannot be owned by multiple admins.
- Add clear admin reassignment or deactivation flows when company ownership changes.

### 4. Scope all business records by company
- Confirm every employee, attendance, leave, payroll, announcement, notification, and audit row has a valid `company_id`.
- Add company checks to all server actions and RLS policies.
- Prevent cross-company queries even if they bypass the UI.

### 5. Add rollout and validation checks
- Migrate existing single-company data safely without data loss.
- Validate a two-company scenario in the database and app flows.
- Confirm that employees and HR users from Company A cannot view Company B records.

## Success criteria
- A second admin can create a second company without breaking the first.
- Each company is independent and data is isolated by `company_id`.
- The app does not assume there is only one tenant in the deployment.
- The system remains safe under admin, HR, and employee access paths.

## Notes
This is a compatibility-focused fix to the current codebase: the app already has company-scoped schema work underway, and the remaining work is to stop treating the first company as the only valid tenant in the entire application.
