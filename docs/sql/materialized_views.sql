-- Helper display-name mapping
create or replace function map_company_display_name(prefix text)
returns text language sql immutable as $$
  select case prefix
    when 'AL_ASHBAL_AJMAN' then 'AL ASHBAL AJMAN'
    when 'AL ASHBAL AJMAN' then 'AL ASHBAL AJMAN'
    when 'CUBS' then 'CUBS'
    when 'CUBS CONTRACTING' then 'CUBS CONTRACTING'
    when 'ASHBAL_AL_KHALEEJ' then 'ASHBAL AL KHALEEJ'
    when 'FLUID_ENGINEERING' then 'FLUID'
    when 'RUKIN_AL_ASHBAL' then 'RUKIN'
    when 'GOLDEN_CUBS' then 'GOLDEN CUBS'
    when 'AL MACEN' then 'AL MACEN'
    when 'CUBS_TECH' then 'CUBS'
    when 'CUBS TECH' then 'CUBS'
    when 'EMP_ALHT' then 'AL HANA TOURS & TRAVELS'
    when 'EMP_COMPANY_DOCS' then 'Company Documents'
    when 'AL HANA TOURS and TRAVELS' then 'AL HANA TOURS & TRAVELS'
    else replace(prefix, '_', ' ')
  end
$$;

-- Schedule materialized view refreshes (requires pg_cron extension on Supabase project)
-- Safe no-op if pg_cron is unavailable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Refresh every 10 minutes
    PERFORM cron.schedule(
      'refresh_company_folders_mv',
      '*/10 * * * *',
      $job$REFRESH MATERIALIZED VIEW CONCURRENTLY public.company_document_folders_mv;$job$
    );
    PERFORM cron.schedule(
      'refresh_employee_counts_mv',
      '*/10 * * * *',
      $job$REFRESH MATERIALIZED VIEW CONCURRENTLY public.employee_counts_by_company_mv;$job$
    );
    PERFORM cron.schedule(
      'refresh_visa_expiry_mv',
      '0 */6 * * *',
      $job$REFRESH MATERIALIZED VIEW CONCURRENTLY public.visa_expiry_monitoring_mv;$job$
    );
    PERFORM cron.schedule(
      'refresh_company_stats_mv',
      '0 */2 * * *',
      $job$REFRESH MATERIALIZED VIEW CONCURRENTLY public.company_statistics_mv;$job$
    );
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_uploaded_at
  ON public.employee_documents (employee_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_at
  ON public.employee_documents (uploaded_at DESC);
-- Trigram index for fuzzy search by name/path (requires pg_trgm)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    CREATE INDEX IF NOT EXISTS gin_employee_documents_file_name_trgm
      ON public.employee_documents USING gin (file_name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS gin_employee_documents_file_path_trgm
      ON public.employee_documents USING gin (file_path gin_trgm_ops);
  END IF;
END $$;

-- Company folders MV
drop materialized view if exists company_document_folders_mv;
create materialized view company_document_folders_mv as
with src as (
  select
    split_part(file_path, '/', 1) as raw_prefix,
    uploaded_at
  from public.employee_documents
  where file_path is not null and file_path <> ''
    and split_part(file_path, '/', 1) <> 'FINAL_TEST'
), canonical as (
  select
    case
      when raw_prefix in ('EMP_COMPANY_DOCS', 'Company Documents') then 'COMPANY_DOCUMENTS'
      when raw_prefix = 'CUBS_TECH' then 'CUBS'
      when raw_prefix = 'AL_ASHBAL_AJMAN' then 'AL ASHBAL AJMAN'
      else raw_prefix
    end as company_prefix,
    uploaded_at
  from src
)
select
  company_prefix,
    case
    when company_prefix = 'COMPANY_DOCUMENTS' then 'Company Documents'
    else map_company_display_name(company_prefix)
  end as display_name,
  count(*)::int as document_count,
  max(uploaded_at) as last_modified
from canonical
group by 1, 2;

create index if not exists idx_company_document_folders_mv_prefix on company_document_folders_mv(company_prefix);
-- Required for CONCURRENTLY refresh
create unique index if not exists uq_company_document_folders_mv_prefix on company_document_folders_mv(company_prefix);

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
-- Required for CONCURRENTLY refresh (unique row identity)
create unique index if not exists uq_employee_counts_by_company_mv_key on employee_counts_by_company_mv(company_prefix, employee_id, employee_name);

-- Visa expiry monitoring MV
drop materialized view if exists visa_expiry_monitoring_mv;
create materialized view visa_expiry_monitoring_mv as
select
  e.employee_id,
  e.name as employee_name,
  e.company_name,
  e.visa_expiry_date,
  e.passport_expiry,
  e.labourcard_expiry,
  e.visa_status,
  e.visa_type,
  e.nationality,
  e.mobile_number,
  e.email_id,
  current_date as check_date,
  (e.visa_expiry_date - current_date) as days_until_visa_expiry,
  (e.passport_expiry - current_date) as days_until_passport_expiry,
  (e.labourcard_expiry - current_date) as days_until_labourcard_expiry,
  case
    when (e.visa_expiry_date - current_date) <= 7 then 'CRITICAL'
    when (e.visa_expiry_date - current_date) <= 15 then 'URGENT'
    when (e.visa_expiry_date - current_date) <= 30 then 'WARNING'
    when (e.visa_expiry_date - current_date) <= 60 then 'NOTICE'
    else 'OK'
  end as visa_alert_level,
  case
    when (e.passport_expiry - current_date) <= 30 then 'WARNING'
    when (e.passport_expiry - current_date) <= 60 then 'NOTICE'
    else 'OK'
  end as passport_alert_level,
  case
    when (e.labourcard_expiry - current_date) <= 30 then 'WARNING'
    when (e.labourcard_expiry - current_date) <= 60 then 'NOTICE'
    else 'OK'
  end as labourcard_alert_level
from public.employee_table e
where e.is_active = true
  and e.status = 'active'
  and (
    e.visa_expiry_date is not null or
    e.passport_expiry is not null or
    e.labourcard_expiry is not null
  );

create index if not exists idx_visa_expiry_monitoring_mv_alert_level on visa_expiry_monitoring_mv(visa_alert_level, days_until_visa_expiry);
create index if not exists idx_visa_expiry_monitoring_mv_company on visa_expiry_monitoring_mv(company_name);
create index if not exists idx_visa_expiry_monitoring_mv_expiry on visa_expiry_monitoring_mv(visa_expiry_date);
-- Required for CONCURRENTLY refresh
create unique index if not exists uq_visa_expiry_monitoring_mv_key on visa_expiry_monitoring_mv(employee_id);

-- Company statistics MV
drop materialized view if exists company_statistics_mv;
create materialized view company_statistics_mv as
select
  company_name,
  count(*) as total_employees,
  count(*) filter (where status = 'active' and is_active = true) as active_employees,
  count(*) filter (where status = 'inactive' or is_active = false) as inactive_employees,
  count(*) filter (where visa_expiry_date is not null and visa_expiry_date <= current_date + interval '30 days') as employees_with_expiring_visa_30d,
  count(*) filter (where visa_expiry_date is not null and visa_expiry_date <= current_date + interval '60 days') as employees_with_expiring_visa_60d,
  count(*) filter (where passport_expiry is not null and passport_expiry <= current_date + interval '60 days') as employees_with_expiring_passport_60d,
  count(*) filter (where labourcard_expiry is not null and labourcard_expiry <= current_date + interval '60 days') as employees_with_expiring_labourcard_60d,
  avg(basic_salary) filter (where basic_salary is not null) as avg_basic_salary,
  min(joining_date) as earliest_joining_date,
  max(joining_date) as latest_joining_date,
  count(distinct nationality) as nationality_count,
  count(distinct trade) as trade_count,
  current_date as stats_date
from public.employee_table
group by company_name;

create index if not exists idx_company_statistics_mv_company on company_statistics_mv(company_name);
-- Required for CONCURRENTLY refresh
create unique index if not exists uq_company_statistics_mv_key on company_statistics_mv(company_name);

-- Employee document summary MV
drop materialized view if exists employee_document_summary_mv;
create materialized view employee_document_summary_mv as
select
  e.employee_id,
  e.name as employee_name,
  e.company_name,
  e.trade,
  e.nationality,
  e.visa_expiry_date,
  e.passport_expiry,
  e.labourcard_expiry,
  e.status,
  e.is_active,
  count(d.id) as total_documents,
  count(d.id) filter (where d.document_type = 'passport') as passport_documents,
  count(d.id) filter (where d.document_type = 'visa') as visa_documents,
  count(d.id) filter (where d.document_type = 'labour_card') as labourcard_documents,
  count(d.id) filter (where d.document_type = 'contract') as contract_documents,
  count(d.id) filter (where d.document_type = 'other') as other_documents,
  max(d.uploaded_at) as last_document_upload,
  array_agg(distinct d.document_type) filter (where d.document_type is not null) as document_types,
  current_date as summary_date
from public.employee_table e
left join public.employee_documents d on e.employee_id = d.employee_id and d.is_active = true
group by e.employee_id, e.name, e.company_name, e.trade, e.nationality, e.visa_expiry_date, e.passport_expiry, e.labourcard_expiry, e.status, e.is_active;

create index if not exists idx_employee_document_summary_mv_employee on employee_document_summary_mv(employee_id);
create index if not exists idx_employee_document_summary_mv_company on employee_document_summary_mv(company_name);
create index if not exists idx_employee_document_summary_mv_status on employee_document_summary_mv(status);
-- Required for CONCURRENTLY refresh
create unique index if not exists uq_employee_document_summary_mv_key on employee_document_summary_mv(employee_id);

-- RPC wrappers for refresh
create or replace function refresh_company_document_folders_mv()
returns void language sql security definer as $$
  refresh materialized view concurrently company_document_folders_mv;
$$;

create or replace function refresh_employee_counts_by_company_mv()
returns void language sql security definer as $$
  refresh materialized view concurrently employee_counts_by_company_mv;
$$;

create or replace function refresh_visa_expiry_monitoring_mv()
returns void language sql security definer as $$
  refresh materialized view concurrently visa_expiry_monitoring_mv;
$$;

create or replace function refresh_company_statistics_mv()
returns void language sql security definer as $$
  refresh materialized view concurrently company_statistics_mv;
$$;

create or replace function refresh_employee_document_summary_mv()
returns void language sql security definer as $$
  refresh materialized view concurrently employee_document_summary_mv;
$$;

-- Function to refresh all materialized views
create or replace function refresh_all_materialized_views()
returns void language plpgsql security definer as $$
begin
  refresh materialized view concurrently company_document_folders_mv;
  refresh materialized view concurrently employee_counts_by_company_mv;
  refresh materialized view concurrently visa_expiry_monitoring_mv;
  refresh materialized view concurrently company_statistics_mv;
  refresh materialized view concurrently employee_document_summary_mv;
end;
$$;

-- Helper function to get employees with expiring documents
create or replace function get_employees_with_expiring_documents(
  days_threshold integer default 30,
  document_type text default 'visa'
)
returns table(
  employee_id text,
  employee_name text,
  company_name text,
  document_type text,
  expiry_date date,
  days_remaining integer,
  alert_level text
) language sql as $$
  select
    vem.employee_id,
    vem.employee_name,
    vem.company_name,
    case
      when document_type = 'visa' then 'visa'
      when document_type = 'passport' then 'passport'
      when document_type = 'labourcard' then 'labourcard'
      else 'visa'
    end as document_type,
    case
      when document_type = 'visa' then vem.visa_expiry_date
      when document_type = 'passport' then vem.passport_expiry
      when document_type = 'labourcard' then vem.labourcard_expiry
      else vem.visa_expiry_date
    end as expiry_date,
    case
      when document_type = 'visa' then vem.days_until_visa_expiry
      when document_type = 'passport' then vem.days_until_passport_expiry
      when document_type = 'labourcard' then vem.days_until_labourcard_expiry
      else vem.days_until_visa_expiry
    end as days_remaining,
    case
      when document_type = 'visa' then vem.visa_alert_level
      when document_type = 'passport' then vem.passport_alert_level
      when document_type = 'labourcard' then vem.labourcard_alert_level
      else vem.visa_alert_level
    end as alert_level
  from visa_expiry_monitoring_mv vem
  where case
    when document_type = 'visa' then vem.days_until_visa_expiry <= days_threshold
    when document_type = 'passport' then vem.days_until_passport_expiry <= days_threshold
    when document_type = 'labourcard' then vem.days_until_labourcard_expiry <= days_threshold
    else vem.days_until_visa_expiry <= days_threshold
  end
  order by days_remaining asc;
$$;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant select on all materialized views in schema public to authenticated;
grant execute on all functions in schema public to authenticated;


