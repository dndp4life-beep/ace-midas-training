create table if not exists public.agent_activity_logs (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  agent_name text not null,
  action_type text not null,
  summary text not null,
  status text not null default 'completed',
  approval_required boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_activity_logs_created_at_idx on public.agent_activity_logs(created_at desc);
create index if not exists agent_activity_logs_agent_key_idx on public.agent_activity_logs(agent_key);
create index if not exists agent_activity_logs_status_idx on public.agent_activity_logs(status);

alter table public.agent_activity_logs enable row level security;
