alter table public.opportunity_response_drafts
  add column if not exists communication_type text default 'General Follow-Up',
  add column if not exists confidence_score integer default 0 check (confidence_score between 0 and 100),
  add column if not exists similarity_score integer default 0 check (similarity_score between 0 and 100),
  add column if not exists trust_score integer default 0 check (trust_score between 0 and 100),
  add column if not exists similar_approved_replies integer default 0,
  add column if not exists automation_eligible boolean default false,
  add column if not exists eligibility_reason text;

create table if not exists public.mia_communication_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null default 'mia_communication_automation',
  approval_level integer not null default 1 check (approval_level between 1 and 4),
  trust_threshold integer not null default 85 check (trust_threshold between 0 and 100),
  confidence_threshold integer not null default 90 check (confidence_threshold between 0 and 100),
  automation_enabled boolean not null default false,
  approved_categories text[] not null default array[]::text[],
  paused boolean not null default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.mia_communication_trust_profiles (
  id uuid primary key default gen_random_uuid(),
  communication_type text unique not null,
  approvals integer not null default 0,
  overrides integer not null default 0,
  edits integer not null default 0,
  rejections integer not null default 0,
  successful_outcomes integer not null default 0,
  sent_count integer not null default 0,
  trust_percentage integer not null default 50 check (trust_percentage between 0 and 100),
  automation_allowed boolean not null default false,
  last_reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mia_communication_memory (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete set null,
  response_draft_id uuid references public.opportunity_response_drafts(id) on delete set null,
  email_triage_id uuid references public.email_triage(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  communication_type text not null,
  opportunity_stage text,
  contact_type text,
  organisation_type text,
  enquiry_type text,
  email_category text,
  response_template_used text,
  draft_subject text,
  draft_body text,
  final_subject text,
  final_body text,
  approval_outcome text default 'draft'
    check (approval_outcome in ('draft', 'approved', 'edited', 'rejected', 'sent', 'paused')),
  follow_up_outcome text,
  confidence_score integer default 0 check (confidence_score between 0 and 100),
  similarity_score integer default 0 check (similarity_score between 0 and 100),
  trust_score integer default 0 check (trust_score between 0 and 100),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mia_follow_up_sequences (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  communication_type text not null default 'Follow-Up Reminder',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'active', 'paused', 'stopped', 'completed')),
  current_step integer not null default 0,
  next_scheduled_for timestamptz,
  stop_reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mia_follow_up_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.mia_follow_up_sequences(id) on delete cascade,
  step_number integer not null,
  step_label text not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'paused', 'ready_for_review', 'sent', 'skipped', 'cancelled')),
  response_draft_id uuid references public.opportunity_response_drafts(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(sequence_id, step_number)
);

insert into public.mia_communication_settings (
  setting_key,
  approval_level,
  trust_threshold,
  confidence_threshold,
  automation_enabled,
  approved_categories,
  paused
)
values (
  'mia_communication_automation',
  1,
  85,
  90,
  false,
  array[]::text[],
  false
)
on conflict (setting_key) do nothing;

create index if not exists mia_communication_memory_opportunity_id_idx on public.mia_communication_memory(opportunity_id);
create index if not exists mia_communication_memory_response_draft_id_idx on public.mia_communication_memory(response_draft_id);
create index if not exists mia_communication_memory_email_triage_id_idx on public.mia_communication_memory(email_triage_id);
create index if not exists mia_communication_memory_contact_id_idx on public.mia_communication_memory(contact_id);
create index if not exists mia_communication_memory_organisation_id_idx on public.mia_communication_memory(organisation_id);
create index if not exists mia_communication_memory_type_idx on public.mia_communication_memory(communication_type);
create index if not exists mia_follow_up_sequences_opportunity_id_idx on public.mia_follow_up_sequences(opportunity_id);
create index if not exists mia_follow_up_sequences_prospect_id_idx on public.mia_follow_up_sequences(prospect_id);
create index if not exists mia_follow_up_sequences_status_idx on public.mia_follow_up_sequences(status);
create index if not exists mia_follow_up_sequence_steps_sequence_id_idx on public.mia_follow_up_sequence_steps(sequence_id);
create index if not exists mia_follow_up_sequence_steps_scheduled_for_idx on public.mia_follow_up_sequence_steps(scheduled_for);
create index if not exists mia_follow_up_sequence_steps_response_draft_id_idx on public.mia_follow_up_sequence_steps(response_draft_id);

alter table public.mia_communication_settings enable row level security;
alter table public.mia_communication_trust_profiles enable row level security;
alter table public.mia_communication_memory enable row level security;
alter table public.mia_follow_up_sequences enable row level security;
alter table public.mia_follow_up_sequence_steps enable row level security;

revoke all on table public.mia_communication_settings from anon, authenticated;
revoke all on table public.mia_communication_trust_profiles from anon, authenticated;
revoke all on table public.mia_communication_memory from anon, authenticated;
revoke all on table public.mia_follow_up_sequences from anon, authenticated;
revoke all on table public.mia_follow_up_sequence_steps from anon, authenticated;

grant select, insert, update, delete on table public.mia_communication_settings to service_role;
grant select, insert, update, delete on table public.mia_communication_trust_profiles to service_role;
grant select, insert, update, delete on table public.mia_communication_memory to service_role;
grant select, insert, update, delete on table public.mia_follow_up_sequences to service_role;
grant select, insert, update, delete on table public.mia_follow_up_sequence_steps to service_role;
