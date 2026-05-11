alter table public.prospects
  add column if not exists region text,
  add column if not exists recommended_service text,
  add column if not exists outreach_brief text,
  add column if not exists status text default 'new',
  add column if not exists do_not_contact boolean default false,
  add column if not exists researched_by text default 'Rory',
  add column if not exists assigned_to text,
  add column if not exists first_contact_sent_at timestamptz,
  add column if not exists follow_up_1_scheduled_for timestamptz,
  add column if not exists follow_up_2_scheduled_for timestamptz,
  add column if not exists last_contacted_at timestamptz;

update public.prospects
set
  status = coalesce(status, review_status, 'new'),
  researched_by = coalesce(researched_by, 'Rory')
where status is null
   or researched_by is null;

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

create index if not exists prospects_status_idx on public.prospects(status);
create index if not exists prospects_do_not_contact_idx on public.prospects(do_not_contact);
create index if not exists prospects_assigned_to_idx on public.prospects(assigned_to);
create index if not exists prospects_recommended_service_idx on public.prospects(recommended_service);
create index if not exists follow_up_tasks_prospect_id_idx on public.follow_up_tasks(prospect_id);
create index if not exists follow_up_tasks_status_idx on public.follow_up_tasks(status);
create index if not exists follow_up_tasks_scheduled_for_idx on public.follow_up_tasks(scheduled_for);

alter table public.follow_up_tasks enable row level security;
