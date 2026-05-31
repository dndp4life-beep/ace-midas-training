create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.ellis_sync_history (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'livemail_imap',
  status text not null default 'pending',
  trigger_source text not null default 'manual',
  unread_found integer default 0,
  imported integer default 0,
  duplicates_skipped integer default 0,
  errors jsonb default '[]'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.sender_domain_intelligence (
  id uuid primary key default gen_random_uuid(),
  domain text unique not null,
  organisation_name text,
  organisation_type text default 'Other',
  suggested_category text default 'Review Later',
  suggested_route text default 'Ellis',
  domain_confidence integer default 50,
  classification_history jsonb default '[]'::jsonb,
  interaction_count integer default 0,
  correction_count integer default 0,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ellis_sync_history_created_at_idx on public.ellis_sync_history(created_at desc);
create index if not exists ellis_sync_history_status_idx on public.ellis_sync_history(status);
create index if not exists sender_domain_intelligence_category_idx on public.sender_domain_intelligence(suggested_category);
create index if not exists sender_domain_intelligence_route_idx on public.sender_domain_intelligence(suggested_route);

alter table public.ellis_sync_history enable row level security;
alter table public.sender_domain_intelligence enable row level security;

revoke all on table public.ellis_sync_history from anon, authenticated;
revoke all on table public.sender_domain_intelligence from anon, authenticated;
grant select, insert, update, delete on table public.ellis_sync_history to service_role;
grant select, insert, update, delete on table public.sender_domain_intelligence to service_role;

create schema if not exists private;

create or replace function private.configure_ellis_inbox_cron(
  sync_secret text,
  cron_expression text default '*/10 * * * *'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_job_id bigint;
  secret_id uuid;
  new_job_id bigint;
begin
  if length(trim(sync_secret)) < 24 then
    raise exception 'Use the same strong ELLIS_SYNC_SECRET configured for the Edge Function.';
  end if;

  select id into secret_id
  from vault.decrypted_secrets
  where name = 'ellis_sync_secret'
  limit 1;

  if secret_id is null then
    perform vault.create_secret(sync_secret, 'ellis_sync_secret', 'Ellis read-only IMAP cron trigger secret');
  else
    perform vault.update_secret(secret_id, sync_secret, 'ellis_sync_secret', 'Ellis read-only IMAP cron trigger secret');
  end if;

  select jobid into existing_job_id
  from cron.job
  where jobname = 'ellis-livemail-sync'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  select cron.schedule(
    'ellis-livemail-sync',
    cron_expression,
    $cron$
      select net.http_post(
        url := 'https://vsenslqoczeutkylnzar.supabase.co/functions/v1/sync-ellis-inbox',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-ellis-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ellis_sync_secret')
        ),
        body := jsonb_build_object('source', 'supabase_cron')
      ) as request_id;
    $cron$
  ) into new_job_id;

  return new_job_id;
end;
$$;

revoke all on function private.configure_ellis_inbox_cron(text, text) from public, anon, authenticated;
