create table if not exists public.inbound_messages (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual',
  from_name text,
  from_email text,
  organisation text,
  subject text,
  message_body text not null,
  classification text not null,
  assigned_agent text not null,
  status text not null default 'routed',
  action_taken text,
  approval_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbound_messages_created_at_idx on public.inbound_messages(created_at desc);
create index if not exists inbound_messages_source_idx on public.inbound_messages(source);
create index if not exists inbound_messages_classification_idx on public.inbound_messages(classification);
create index if not exists inbound_messages_assigned_agent_idx on public.inbound_messages(assigned_agent);
create index if not exists inbound_messages_status_idx on public.inbound_messages(status);

alter table public.inbound_messages enable row level security;
