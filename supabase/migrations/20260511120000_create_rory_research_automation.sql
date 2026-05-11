create extension if not exists pgcrypto;

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  organisation_name text not null,
  sector text,
  website text,
  location text,
  region text,
  contact_email text,
  phone text,
  decision_maker_name text,
  likely_training_need text,
  recommended_service text,
  priority text default 'medium',
  score integer default 0,
  source_url text,
  notes text,
  relevance_reason text,
  outreach_brief text,
  review_status text default 'pending_review',
  status text default 'new',
  do_not_contact boolean default false,
  researched_by text default 'Rory',
  assigned_to text,
  first_contact_sent_at timestamptz,
  follow_up_1_scheduled_for timestamptz,
  follow_up_2_scheduled_for timestamptz,
  last_contacted_at timestamptz,
  created_by_agent text default 'rory',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prospects
  add column if not exists sector text,
  add column if not exists website text,
  add column if not exists location text,
  add column if not exists region text,
  add column if not exists contact_email text,
  add column if not exists phone text,
  add column if not exists decision_maker_name text,
  add column if not exists likely_training_need text,
  add column if not exists recommended_service text,
  add column if not exists priority text default 'medium',
  add column if not exists score integer default 0,
  add column if not exists source_url text,
  add column if not exists notes text,
  add column if not exists relevance_reason text,
  add column if not exists outreach_brief text,
  add column if not exists review_status text default 'pending_review',
  add column if not exists status text default 'new',
  add column if not exists do_not_contact boolean default false,
  add column if not exists researched_by text default 'Rory',
  add column if not exists assigned_to text,
  add column if not exists first_contact_sent_at timestamptz,
  add column if not exists follow_up_1_scheduled_for timestamptz,
  add column if not exists follow_up_2_scheduled_for timestamptz,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists created_by_agent text default 'rory',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.prospects
set
  status = coalesce(status, review_status, 'new'),
  researched_by = coalesce(researched_by, 'Rory'),
  score = coalesce(score, 0),
  updated_at = coalesce(updated_at, now())
where status is null
   or researched_by is null
   or score is null
   or updated_at is null;

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete cascade,
  agent_name text default 'Mia',
  task_type text,
  status text default 'pending',
  scheduled_for timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.rory_research_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text,
  status text,
  search_theme text,
  provider text,
  provider_task_id text,
  provider_task_url text,
  prospects_found integer default 0,
  prospects_saved integer default 0,
  duplicates_skipped integer default 0,
  errors text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.rory_research_runs
  add column if not exists provider text,
  add column if not exists provider_task_id text,
  add column if not exists provider_task_url text;

create index if not exists prospects_organisation_name_idx on public.prospects(organisation_name);
create index if not exists prospects_website_idx on public.prospects(website);
create index if not exists prospects_contact_email_idx on public.prospects(contact_email);
create index if not exists prospects_priority_idx on public.prospects(priority);
create index if not exists prospects_score_idx on public.prospects(score);
create index if not exists prospects_status_idx on public.prospects(status);
create index if not exists prospects_review_status_idx on public.prospects(review_status);
create index if not exists prospects_do_not_contact_idx on public.prospects(do_not_contact);
create index if not exists prospects_assigned_to_idx on public.prospects(assigned_to);
create index if not exists prospects_recommended_service_idx on public.prospects(recommended_service);
create index if not exists prospects_created_at_idx on public.prospects(created_at desc);

create index if not exists follow_up_tasks_prospect_id_idx on public.follow_up_tasks(prospect_id);
create index if not exists follow_up_tasks_status_idx on public.follow_up_tasks(status);
create index if not exists follow_up_tasks_scheduled_for_idx on public.follow_up_tasks(scheduled_for);

create index if not exists rory_research_runs_status_idx on public.rory_research_runs(status);
create index if not exists rory_research_runs_search_theme_idx on public.rory_research_runs(search_theme);
create index if not exists rory_research_runs_provider_task_id_idx on public.rory_research_runs(provider_task_id);
create index if not exists rory_research_runs_started_at_idx on public.rory_research_runs(started_at desc);

alter table public.prospects enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.rory_research_runs enable row level security;
