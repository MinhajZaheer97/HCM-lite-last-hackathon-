-- Run after migration 010 while signed in as an admin from each company.
-- Every result should show only rows belonging to the current admin's company.

select 'companies' as table_name, count(*) as visible_rows from companies;
select 'profiles' as table_name, count(*) as visible_rows from profiles;
select 'employees' as table_name, count(*) as visible_rows from employees;
select 'departments' as table_name, count(*) as visible_rows from departments;
select 'attendance_records' as table_name, count(*) as visible_rows from attendance_records;
select 'leave_requests' as table_name, count(*) as visible_rows from leave_requests;
select 'payroll_runs' as table_name, count(*) as visible_rows from payroll_runs;
select 'announcements' as table_name, count(*) as visible_rows from announcements;

-- This should return the current user's company ID only.
select id, name from companies order by id;
