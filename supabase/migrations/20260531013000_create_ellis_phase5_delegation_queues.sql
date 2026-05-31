create table if not exists public.ellis_delegations (
  id uuid primary key default gen_random_uuid(),
  email_triage_id uuid unique references public.email_triage(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  sender_name text,
  sender_email text,
  summary text,
  category text,
  priority text default 'Medium',
  confidence_score integer default 0,
  recommended_agent text default 'Ellis',
  selected_agent text,
  recommended_task_title text,
  recommended_next_action text,
  due_date_suggestion date,
  reason_for_recommendation text,
  handoff_note jsonb default '{}'::jsonb,
  review_status text default 'Pending',
  activity_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agent_work_queue (
  id uuid primary key default gen_random_uuid(),
  delegation_id uuid unique references public.ellis_delegations(id) on delete set null,
  linked_email_id uuid references public.email_triage(id) on delete set null,
  linked_contact_id uuid references public.crm_contacts(id) on delete set null,
  linked_organisation_id uuid references public.organisations(id) on delete set null,
  prospect_id uuid references public.prospects(id) on delete set null,
  task_title text not null,
  task_description text,
  assigned_agent text not null,
  category text,
  organisation_type text,
  priority text default 'Medium',
  due_date date,
  status text default 'New',
  activity_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ellis_alert_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null default 'urgent_prospect_alerts',
  alerts_enabled boolean default true,
  notify_by_email boolean default true,
  notification_email text default 'info@ace-midas-training.co.uk',
  minimum_prospect_score integer default 75,
  warm_high_priority_only boolean default true,
  cooldown_minutes integer default 1440,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ellis_urgent_alerts (
  id uuid primary key default gen_random_uuid(),
  email_triage_id uuid unique references public.email_triage(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  alert_type text default 'rory_prospect_match',
  prospect_name text,
  sender_email text,
  subject text,
  summary text,
  match_reason text,
  recommended_action text,
  status text default 'pending',
  email_notification_sent boolean default false,
  provider_response jsonb default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.ellis_alert_settings(setting_key)
values ('urgent_prospect_alerts')
on conflict (setting_key) do nothing;

create index if not exists ellis_delegations_review_status_idx on public.ellis_delegations(review_status);
create index if not exists ellis_delegations_recommended_agent_idx on public.ellis_delegations(recommended_agent);
create index if not exists ellis_delegations_prospect_id_idx on public.ellis_delegations(prospect_id);
create index if not exists agent_work_queue_assigned_agent_idx on public.agent_work_queue(assigned_agent);
create index if not exists agent_work_queue_status_idx on public.agent_work_queue(status);
create index if not exists agent_work_queue_due_date_idx on public.agent_work_queue(due_date);
create index if not exists agent_work_queue_linked_email_idx on public.agent_work_queue(linked_email_id);
create index if not exists ellis_urgent_alerts_created_at_idx on public.ellis_urgent_alerts(created_at desc);

alter table public.ellis_delegations enable row level security;
alter table public.agent_work_queue enable row level security;
alter table public.ellis_alert_settings enable row level security;
alter table public.ellis_urgent_alerts enable row level security;

revoke all on table public.ellis_delegations from anon, authenticated;
revoke all on table public.agent_work_queue from anon, authenticated;
revoke all on table public.ellis_alert_settings from anon, authenticated;
revoke all on table public.ellis_urgent_alerts from anon, authenticated;

grant select, insert, update, delete on table public.ellis_delegations to service_role;
grant select, insert, update, delete on table public.agent_work_queue to service_role;
grant select, insert, update, delete on table public.ellis_alert_settings to service_role;
grant select, insert, update, delete on table public.ellis_urgent_alerts to service_role;
