create or replace function private.set_ellis_sync_secret(sync_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_id uuid;
begin
  if sync_secret is null or length(trim(sync_secret)) = 0 then
    raise exception 'ELLIS_SYNC_SECRET cannot be empty.';
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
end;
$$;

create or replace function private.schedule_ellis_inbox_cron(
  cron_expression text default '*/10 * * * *'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_job_id bigint;
  new_job_id bigint;
begin
  if cron_expression is null or length(trim(cron_expression)) = 0 then
    raise exception 'Cron expression cannot be empty.';
  end if;

  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'ellis_sync_secret'
      and length(trim(decrypted_secret)) > 0
  ) then
    raise exception 'ELLIS_SYNC_SECRET has not been stored in Supabase Vault.';
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

create or replace function private.configure_ellis_inbox_cron(
  sync_secret text,
  cron_expression text default '*/10 * * * *'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.set_ellis_sync_secret(sync_secret);
  return private.schedule_ellis_inbox_cron(cron_expression);
end;
$$;

revoke all on function private.set_ellis_sync_secret(text) from public, anon, authenticated;
revoke all on function private.schedule_ellis_inbox_cron(text) from public, anon, authenticated;
revoke all on function private.configure_ellis_inbox_cron(text, text) from public, anon, authenticated;
