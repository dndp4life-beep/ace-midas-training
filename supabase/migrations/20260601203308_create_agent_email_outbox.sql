create table if not exists public.agent_email_outbox (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  agent_name text not null,
  purpose text not null default 'agent_email',
  recipient_email text not null,
  sender_email text not null,
  reply_to_email text,
  bcc_emails text[] not null default '{}',
  subject text not null,
  html_body text not null,
  status text not null default 'prepared'
    check (status in ('prepared', 'sending', 'accepted', 'delivered', 'delivery_delayed', 'bounced', 'complained', 'failed')),
  resend_email_id text,
  provider_response jsonb not null default '{}'::jsonb,
  failure_reason text,
  prospect_id uuid references public.prospects(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  reply_intake_id uuid references public.reply_intake(id) on delete set null,
  training_record_id uuid references public.training_records(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  sent_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_email_outbox_created_at_idx
  on public.agent_email_outbox(created_at desc);

create index if not exists agent_email_outbox_status_idx
  on public.agent_email_outbox(status);

create index if not exists agent_email_outbox_resend_email_id_idx
  on public.agent_email_outbox(resend_email_id);

create index if not exists agent_email_outbox_prospect_id_idx
  on public.agent_email_outbox(prospect_id);

alter table public.agent_email_outbox enable row level security;
revoke all on table public.agent_email_outbox from anon, authenticated;
grant select, insert, update, delete on table public.agent_email_outbox to service_role;

alter table public.mia_outreach_queue
  add column if not exists sender_email text,
  add column if not exists reply_to_email text,
  add column if not exists bcc_emails text[] not null default '{}',
  add column if not exists resend_email_id text,
  add column if not exists delivery_status text not null default 'not_sent',
  add column if not exists agent_email_outbox_id uuid references public.agent_email_outbox(id) on delete set null;

create index if not exists mia_outreach_queue_agent_email_outbox_id_idx
  on public.mia_outreach_queue(agent_email_outbox_id);
