-- ============================================================
-- HCM Lite - 009_fix_company_admin_signup.sql
-- Fix company-first admin signup after company ownership became required.
-- ============================================================

begin;

-- Company creation happens before Auth user creation. The new user's
-- metadata carries company_id so the profile trigger can satisfy the
-- non-null ownership constraint.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, company_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee'),
    nullif(new.raw_user_meta_data ->> 'company_id', '')::int
  );
  return new;
end $$;

-- Audit rows must carry the owning company. For company rows, the company
-- ID is the row ID; for all other scoped rows, use their company_id.
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action text := lower(tg_op);
  v_row jsonb;
  v_entity_id text;
  v_company_id int;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_entity_id := coalesce(v_row ->> 'id', v_row ->> 'emp_code', tg_table_name);
  v_company_id := case
    when tg_table_name = 'companies' then (v_row ->> 'id')::int
    else nullif(v_row ->> 'company_id', '')::int
  end;

  insert into audit_logs (actor_id, actor_label, action, entity, entity_id, details, company_id)
  values (
    auth.uid(),
    coalesce(
      (select role from profiles where id = auth.uid()),
      case when auth.uid() is null then 'system' else 'unknown' end
    ),
    v_action,
    tg_table_name,
    v_entity_id,
    v_row,
    v_company_id
  );
  return coalesce(new, old);
end $$;

commit;
