alter table public.organisations
  add column if not exists organisation_type text default 'Other',
  add column if not exists primary_contact_id uuid,
  add column if not exists secondary_contacts jsonb default '[]'::jsonb,
  add column if not exists address text,
  add column if not exists website text,
  add column if not exists notes text,
  add column if not exists first_contact_date timestamptz,
  add column if not exists last_contact_date timestamptz,
  add column if not exists interaction_count integer default 0,
  add column if not exists enquiries_received integer default 0,
  add column if not exists bookings_completed integer default 0,
  add column if not exists estimated_lifetime_value numeric(12, 2) default 0,
  add column if not exists relationship_score integer default 0,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  full_name text,
  email_address text not null,
  phone_number text,
  organisation_id uuid references public.organisations(id) on delete set null,
  organisation text,
  job_title text,
  contact_type text default 'Other',
  tags text[] default '{}',
  notes text,
  first_contact_date timestamptz default now(),
  last_contact_date timestamptz default now(),
  interaction_count integer default 0,
  enquiry_count integer default 0,
  booking_count integer default 0,
  estimated_value numeric(12, 2) default 0,
  relationship_score integer default 0,
  relationship_category text default 'Unknown',
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists crm_contacts_email_unique_idx
  on public.crm_contacts(lower(email_address));

alter table public.organisations
  drop constraint if exists organisations_primary_contact_id_fkey;

alter table public.organisations
  add constraint organisations_primary_contact_id_fkey
  foreign key (primary_contact_id)
  references public.crm_contacts(id)
  on delete set null;

create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  email_triage_id uuid references public.email_triage(id) on delete set null,
  assigned_user text,
  opportunity_reference text,
  interaction_type text not null default 'Email',
  subject text,
  summary text,
  metadata jsonb default '{}'::jsonb,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.relationship_scores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  score integer not null default 0,
  category text not null default 'Unknown',
  factors jsonb default '{}'::jsonb,
  calculated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.crm_insights (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  insight_type text not null,
  insight_text text not null,
  priority text default 'Medium',
  status text default 'Active',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ellis_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email_id uuid references public.email_triage(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  original_category text,
  original_priority text,
  original_agent_suggestion text,
  user_selected_agent text,
  action_type text not null,
  was_override boolean default false,
  was_undo boolean default false,
  confidence_before numeric,
  confidence_after numeric,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.ellis_action_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email_id uuid references public.email_triage(id) on delete set null,
  action_taken text not null,
  previous_state jsonb default '{}'::jsonb,
  new_state jsonb default '{}'::jsonb,
  is_undone boolean default false,
  undone_at timestamptz,
  created_at timestamptz default now()
);

alter table public.email_triage
  add column if not exists contact_id uuid references public.crm_contacts(id) on delete set null,
  add column if not exists organisation_id uuid references public.organisations(id) on delete set null,
  add column if not exists assigned_route text default 'Ellis',
  add column if not exists crm_enriched_at timestamptz;

alter table public.ellis_tasks
  add column if not exists contact_id uuid references public.crm_contacts(id) on delete set null,
  add column if not exists organisation_id uuid references public.organisations(id) on delete set null;

create index if not exists crm_contacts_organisation_id_idx on public.crm_contacts(organisation_id);
create index if not exists crm_contacts_last_contact_date_idx on public.crm_contacts(last_contact_date desc);
create index if not exists crm_contacts_relationship_score_idx on public.crm_contacts(relationship_score desc);
create index if not exists crm_interactions_contact_id_idx on public.crm_interactions(contact_id);
create index if not exists crm_interactions_organisation_id_idx on public.crm_interactions(organisation_id);
create index if not exists crm_interactions_occurred_at_idx on public.crm_interactions(occurred_at desc);
create unique index if not exists crm_interactions_email_triage_unique_idx
  on public.crm_interactions(email_triage_id)
  where email_triage_id is not null;
create index if not exists relationship_scores_contact_id_idx on public.relationship_scores(contact_id);
create index if not exists relationship_scores_organisation_id_idx on public.relationship_scores(organisation_id);
create index if not exists crm_insights_status_idx on public.crm_insights(status);
create index if not exists crm_insights_priority_idx on public.crm_insights(priority);
create unique index if not exists crm_insights_contact_type_unique_idx
  on public.crm_insights(contact_id, insight_type)
  where contact_id is not null;
create index if not exists ellis_learning_events_created_at_idx on public.ellis_learning_events(created_at desc);
create index if not exists ellis_learning_events_email_id_idx on public.ellis_learning_events(email_id);
create index if not exists ellis_action_history_email_id_idx on public.ellis_action_history(email_id);
create index if not exists email_triage_contact_id_idx on public.email_triage(contact_id);
create index if not exists email_triage_organisation_id_idx on public.email_triage(organisation_id);

alter table public.crm_contacts enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.relationship_scores enable row level security;
alter table public.crm_insights enable row level security;
alter table public.ellis_learning_events enable row level security;
alter table public.ellis_action_history enable row level security;

revoke all on table public.crm_contacts from anon, authenticated;
revoke all on table public.crm_interactions from anon, authenticated;
revoke all on table public.relationship_scores from anon, authenticated;
revoke all on table public.crm_insights from anon, authenticated;
revoke all on table public.ellis_learning_events from anon, authenticated;
revoke all on table public.ellis_action_history from anon, authenticated;

grant select, insert, update, delete on table public.crm_contacts to service_role;
grant select, insert, update, delete on table public.crm_interactions to service_role;
grant select, insert, update, delete on table public.relationship_scores to service_role;
grant select, insert, update, delete on table public.crm_insights to service_role;
grant select, insert, update, delete on table public.ellis_learning_events to service_role;
grant select, insert, update, delete on table public.ellis_action_history to service_role;
