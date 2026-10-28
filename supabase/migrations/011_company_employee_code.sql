-- ============================================================
-- HCM Lite - 011_company_employee_code.sql
-- Employee codes are unique within a company, not globally.
-- ============================================================

begin;

alter table employees drop constraint if exists employees_emp_code_key;
alter table employees
  add constraint employees_company_emp_code_key unique (company_id, emp_code);

commit;
