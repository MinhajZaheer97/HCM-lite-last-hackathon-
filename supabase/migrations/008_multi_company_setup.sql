-- ============================================================
-- HCM Lite — 008_multi_company_setup.sql
-- Remove the legacy single-company lock from existing databases and
-- allow additional company rows to be created.
-- ============================================================

begin;

-- Existing projects created from older migrations may still have the
-- legacy singleton company constraint. Remove it while preserving data.
alter table companies drop constraint if exists companies_id_check;

-- Ensure new company IDs can be generated beyond the current max value.
create sequence if not exists companies_id_seq;
select setval(
  'companies_id_seq',
  coalesce((select max(id) from companies), 0) + 1,
  false
);

alter table companies alter column id drop default;
alter table companies alter column id set default nextval('companies_id_seq');
alter sequence companies_id_seq owned by companies.id;

commit;
