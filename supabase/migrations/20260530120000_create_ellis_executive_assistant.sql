create table if not exists public.mailbox_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  mailbox_email text,
  display_name text,
  status text not null default 'not_connected',
  token_reference text,
  scopes text[] not null default '{}',
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_triage (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  mailbox_connection_id uuid references public.mailbox_connections(id) on delete set null,
  external_message_id text,
  source text not null default 'manual',
  sender_name text,
  sender_email text not null,
  subject text not null,
  received_at timestamptz not null default now(),
  raw_excerpt text,
  summary text not null,
  category text not null default 'Review Later',
  priority text not null default 'Medium',
  confidence_score numeric(5,2) not null default 0,
  recommended_action text not null default 'Review',
  requires_review boolean not null default true,
  review_status text not null default 'Pending',
  reasoning_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ellis_daily_briefings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  briefing_date date not null default current_date,
  summary text not null,
  metrics jsonb not null default '{}'::jsonb,
  urgent_emails jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  status text not null default 'Generated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ellis_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  related_email_id uuid references public.email_triage(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'Medium',
  status text not null default 'Open',
  assigned_user text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ellis_activity_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  email_triage_id uuid references public.email_triage(id) on delete set null,
  task_id uuid references public.ellis_tasks(id) on delete set null,
  action_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_triage_received_at_idx on public.email_triage(received_at desc);
create index if not exists email_triage_category_idx on public.email_triage(category);
create index if not exists email_triage_priority_idx on public.email_triage(priority);
create index if not exists email_triage_review_status_idx on public.email_triage(review_status);
create index if not exists email_triage_requires_review_idx on public.email_triage(requires_review);
create index if not exists ellis_daily_briefings_date_idx on public.ellis_daily_briefings(briefing_date desc);
create index if not exists ellis_tasks_status_idx on public.ellis_tasks(status);
create index if not exists ellis_tasks_due_date_idx on public.ellis_tasks(due_date);
create index if not exists ellis_activity_log_created_at_idx on public.ellis_activity_log(created_at desc);
create index if not exists mailbox_connections_owner_idx on public.mailbox_connections(owner_id);

alter table public.mailbox_connections enable row level security;
alter table public.email_triage enable row level security;
alter table public.ellis_daily_briefings enable row level security;
alter table public.ellis_tasks enable row level security;
alter table public.ellis_activity_log enable row level security;

comment on column public.mailbox_connections.token_reference is
  'Reference to a future encrypted OAuth token store. Never store mailbox passwords or raw OAuth tokens here.';
