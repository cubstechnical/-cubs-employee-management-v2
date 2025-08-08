-- Helper display-name mapping
create or replace function map_company_display_name(prefix text)
returns text language sql immutable as $$
  select case prefix
    when 'AL_ASHBAL_AJMAN' then 'AL ASHBAL AJMAN'
    when 'CUBS' then 'CUBS CONTRACTING'
    when 'ASHBAL_AL_KHALEEJ' then 'ASHBAL AL KHALEEJ'
    when 'FLUID_ENGINEERING' then 'FLUID'
    when 'RUKIN_AL_ASHBAL' then 'RUKIN'
    when 'GOLDEN_CUBS' then 'GOLDEN CUBS'
    when 'AL MACEN' then 'AL MACEN'
    when 'CUBS_TECH' then 'CUBS TECH'
    when 'EMP_ALHT' then 'AL HANA TOURS & TRAVELS'
    when 'EMP_COMPANY_DOCS' then 'Company Documents'
    when 'AL HANA TOURS and TRAVELS' then 'AL HANA TOURS & TRAVELS'
    else replace(prefix, '_', ' ')
  end
$$;

-- Company folders MV
drop materialized view if exists company_document_folders_mv;
create materialized view company_document_folders_mv as
select
  split_part(file_path, '/', 1) as company_prefix,
  map_company_display_name(split_part(file_path, '/', 1)) as display_name,
  count(*)::int as document_count,
  max(uploaded_at) as last_modified
from public.employee_documents
where file_path is not null and file_path <> ''
group by 1;

create index if not exists idx_company_document_folders_mv_prefix on company_document_folders_mv(company_prefix);

-- Employee counts by company MV
drop materialized view if exists employee_counts_by_company_mv;
create materialized view employee_counts_by_company_mv as
select
  split_part(d.file_path, '/', 1) as company_prefix,
  d.employee_id,
  coalesce(e.name, d.employee_id) as employee_name,
  count(*)::int as document_count,
  max(d.uploaded_at) as last_modified
from public.employee_documents d
left join public.employee_table e on e.employee_id = d.employee_id
where d.file_path is not null and d.file_path <> ''
group by 1, 2, 3;

create index if not exists idx_employee_counts_by_company_mv_prefix on employee_counts_by_company_mv(company_prefix);
create index if not exists idx_employee_counts_by_company_mv_emp on employee_counts_by_company_mv(company_prefix, employee_id);

-- RPC wrappers for refresh
create or replace function refresh_company_document_folders_mv()
returns void language sql security definer as $$
  refresh materialized view concurrently company_document_folders_mv;
$$;

create or replace function refresh_employee_counts_by_company_mv()
returns void language sql security definer as $$
  refresh materialized view concurrently employee_counts_by_company_mv;
$$;


