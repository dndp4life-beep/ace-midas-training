create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  prospect_id uuid references public.prospects(id) on delete set null,
  source text default 'ellis_crm',
  created_by text default 'Ellis',
  assigned_agent text default 'Mia',
  stage text not null default 'Prospect Found'
    check (stage in (
      'Prospect Found',
      'Outreach Sent',
      'Contact Engaged',
      'Information Requested',
      'Quote Requested',
      'Quote Sent',
      'Follow-Up Due',
      'Negotiation',
      'Won',
      'Lost',
      'Dormant'
    )),
  estimated_value numeric(12, 2) default 0,
  confidence integer default 0 check (confidence between 0 and 100),
  is_hot boolean default false,
  hot_reason text,
  next_action text,
  next_action_due date,
  last_contact_date timestamptz,
  last_response_date timestamptz,
  notes text,
  status text not null default 'open'
    check (status in ('open', 'won', 'lost', 'dormant')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.opportunity_email_links (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  email_triage_id uuid unique not null references public.email_triage(id) on delete cascade,
  reply_classification text default 'other',
  suggested_stage text,
  analysis_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.opportunity_response_drafts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  email_triage_id uuid references public.email_triage(id) on delete set null,
  agent_name text default 'Mia',
  draft_subject text,
  draft_body text,
  suggested_stage text,
  suggested_follow_up_date date,
  status text default 'draft'
    check (status in ('draft', 'approved', 'edited', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prospects
  add column if not exists pipeline_stage text default 'Prospect Found';

alter table public.prospects
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;

alter table public.agent_work_queue
  add column if not exists linked_opportunity_id uuid references public.opportunities(id) on delete set null;

create index if not exists opportunities_organisation_id_idx on public.opportunities(organisation_id);
create index if not exists opportunities_contact_id_idx on public.opportunities(contact_id);
create index if not exists opportunities_prospect_id_idx on public.opportunities(prospect_id);
create index if not exists opportunities_stage_idx on public.opportunities(stage);
create index if not exists opportunities_status_idx on public.opportunities(status);
create index if not exists opportunities_hot_idx on public.opportunities(is_hot) where is_hot = true;
create index if not exists opportunities_next_action_due_idx on public.opportunities(next_action_due);
create index if not exists opportunity_email_links_opportunity_id_idx on public.opportunity_email_links(opportunity_id);
create index if not exists opportunity_response_drafts_opportunity_id_idx on public.opportunity_response_drafts(opportunity_id);
create index if not exists opportunity_response_drafts_email_triage_id_idx on public.opportunity_response_drafts(email_triage_id);
create index if not exists prospects_opportunity_id_idx on public.prospects(opportunity_id);
create index if not exists agent_work_queue_linked_opportunity_id_idx on public.agent_work_queue(linked_opportunity_id);

alter table public.opportunities enable row level security;
alter table public.opportunity_email_links enable row level security;
alter table public.opportunity_response_drafts enable row level security;

revoke all on table public.opportunities from anon, authenticated;
revoke all on table public.opportunity_email_links from anon, authenticated;
revoke all on table public.opportunity_response_drafts from anon, authenticated;

grant select, insert, update, delete on table public.opportunities to service_role;
grant select, insert, update, delete on table public.opportunity_email_links to service_role;
grant select, insert, update, delete on table public.opportunity_response_drafts to service_role;
