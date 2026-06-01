create table if not exists public.mia_outreach_queue (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  outreach_type text not null default 'initial',
  recipient_email text,
  email_subject text,
  email_html text,
  status text not null default 'sent_to_mia',
  autosend_enabled boolean not null default false,
  send_attempted_at timestamptz,
  sent_at timestamptz,
  failure_reason text,
  provider_response jsonb not null default '{}'::jsonb,
  linked_log_id uuid references public.agent_activity_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mia_outreach_queue_status_check check (
    status in ('sent_to_mia', 'drafted', 'queued', 'sending', 'sent', 'failed', 'skipped', 'awaiting_review')
  ),
  constraint mia_outreach_queue_prospect_outreach_type_key unique (prospect_id, outreach_type)
);

create index if not exists mia_outreach_queue_status_idx
  on public.mia_outreach_queue(status);

create index if not exists mia_outreach_queue_created_at_idx
  on public.mia_outreach_queue(created_at desc);

alter table public.mia_outreach_queue enable row level security;

revoke all on table public.mia_outreach_queue from anon, authenticated;
grant select, insert, update, delete on table public.mia_outreach_queue to service_role;
