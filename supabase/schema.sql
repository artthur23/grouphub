-- ============================================================
-- GroupHub — Schema SQL
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensão para UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUM types
-- ============================================================
create type source_type as enum ('sendflow', 'devzapp', 'manual', 'other');
create type monitoring_status as enum ('active', 'paused', 'error');
create type run_status as enum ('running', 'success', 'error');
create type group_status as enum ('active', 'invalid', 'error');

-- ============================================================
-- 1. monitored_sources
-- ============================================================
create table monitored_sources (
  id                  uuid primary key default gen_random_uuid(),
  source_url          text not null,
  list_name           text not null,
  source_type         source_type not null,
  interval_minutes    integer not null check (interval_minutes in (30, 60, 90)),
  status              monitoring_status not null default 'active',
  last_run_at         timestamptz,
  next_run_at         timestamptz,
  total_groups_found  integer not null default 0,
  last_error_message  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Trigger para atualizar updated_at automaticamente
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger monitored_sources_updated_at
  before update on monitored_sources
  for each row execute function set_updated_at();

-- ============================================================
-- 2. pulled_groups
-- ============================================================
create table pulled_groups (
  id                    uuid primary key default gen_random_uuid(),
  monitored_source_id   uuid not null references monitored_sources(id) on delete cascade,
  group_link            text not null,
  list_name             text not null,
  source_type           source_type not null,
  group_hash            text not null,
  pulled_at             timestamptz not null default now(),
  status                group_status not null default 'active',
  error_message         text,
  raw_payload           jsonb,
  group_name            text,
  last_checked_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Constraint de duplicidade: mesmo grupo na mesma fonte monitorada
  -- Usar monitored_source_id + group_hash é mais seguro do que list_name + group_hash
  -- porque o mesmo hash pode existir legitimamente em campanhas diferentes
  constraint pulled_groups_unique_per_source unique (monitored_source_id, group_hash)
);

create trigger pulled_groups_updated_at
  before update on pulled_groups
  for each row execute function set_updated_at();

-- Índices para queries frequentes
create index idx_pulled_groups_source_id on pulled_groups(monitored_source_id);
create index idx_pulled_groups_list_name on pulled_groups(list_name);
create index idx_pulled_groups_source_type on pulled_groups(source_type);
create index idx_pulled_groups_pulled_at on pulled_groups(pulled_at desc);
create index idx_pulled_groups_status on pulled_groups(status);
create index idx_pulled_groups_last_checked_at on pulled_groups(last_checked_at);

-- Para bancos já criados antes das colunas group_name/last_checked_at existirem, rode:
-- alter table pulled_groups add column if not exists last_checked_at timestamptz;
-- alter table pulled_groups add column if not exists group_name text;
-- create index if not exists idx_pulled_groups_last_checked_at on pulled_groups(last_checked_at);

-- ============================================================
-- 3. extraction_runs
-- ============================================================
create table extraction_runs (
  id                    uuid primary key default gen_random_uuid(),
  monitored_source_id   uuid not null references monitored_sources(id) on delete cascade,
  started_at            timestamptz not null default now(),
  finished_at           timestamptz,
  status                run_status not null default 'running',
  groups_found_count    integer not null default 0,
  groups_inserted_count integer not null default 0,
  groups_skipped_count  integer not null default 0,
  error_message         text,
  raw_response          jsonb,
  created_at            timestamptz not null default now()
);

create index idx_extraction_runs_source_id on extraction_runs(monitored_source_id);
create index idx_extraction_runs_started_at on extraction_runs(started_at desc);
create index idx_extraction_runs_status on extraction_runs(status);

-- ============================================================
-- RLS (Row Level Security) — habilitar quando tiver autenticação
-- ============================================================
-- Por ora desabilitado para simplicidade do MVP.
-- Para produção com multi-tenancy, habilitar e adicionar coluna user_id.
--
-- alter table monitored_sources enable row level security;
-- alter table pulled_groups enable row level security;
-- alter table extraction_runs enable row level security;

-- ============================================================
-- View útil: monitoramentos com stats
-- ============================================================
create or replace view monitored_sources_with_stats as
select
  ms.*,
  count(distinct pg.id) filter (where pg.status = 'active') as active_groups_count,
  max(er.started_at) as last_run_started_at,
  (
    select er2.status
    from extraction_runs er2
    where er2.monitored_source_id = ms.id
    order by er2.started_at desc
    limit 1
  ) as last_run_status
from monitored_sources ms
left join pulled_groups pg on pg.monitored_source_id = ms.id
left join extraction_runs er on er.monitored_source_id = ms.id
group by ms.id;
