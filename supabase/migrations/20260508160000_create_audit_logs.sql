create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null default 'agent',
  actor_name text not null,
  action_type text not null,
  summary text not null,
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_type_idx on public.audit_logs(actor_type);
create index if not exists audit_logs_action_type_idx on public.audit_logs(action_type);
create index if not exists audit_logs_status_idx on public.audit_logs(status);

alter table public.audit_logs enable row level security;
