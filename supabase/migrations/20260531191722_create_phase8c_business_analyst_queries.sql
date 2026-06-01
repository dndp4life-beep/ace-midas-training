create table if not exists public.business_analyst_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  question text not null,
  answer_summary text not null,
  data_sources_used text[] default '{}'::text[],
  confidence text not null default 'Low'
    check (confidence in ('High', 'Medium', 'Low')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists business_analyst_queries_created_at_idx
  on public.business_analyst_queries(created_at desc);

alter table public.business_analyst_queries enable row level security;
revoke all on table public.business_analyst_queries from anon, authenticated;
grant select, insert on table public.business_analyst_queries to service_role;
