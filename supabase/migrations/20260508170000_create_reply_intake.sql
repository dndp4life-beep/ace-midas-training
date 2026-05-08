create table if not exists public.reply_intake (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid,
  member_id uuid,
  training_record_id uuid,
  contact_name text,
  contact_email text,
  message text not null,
  classification text not null,
  requested_action text,
  assigned_agent text not null default 'mia',
  approval_required boolean not null default false,
  approval_status text not null default 'not_required',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reply_intake_created_at_idx on public.reply_intake(created_at desc);
create index if not exists reply_intake_classification_idx on public.reply_intake(classification);
create index if not exists reply_intake_assigned_agent_idx on public.reply_intake(assigned_agent);
create index if not exists reply_intake_approval_status_idx on public.reply_intake(approval_status);
create index if not exists reply_intake_organisation_id_idx on public.reply_intake(organisation_id);
create index if not exists reply_intake_member_id_idx on public.reply_intake(member_id);
create index if not exists reply_intake_training_record_id_idx on public.reply_intake(training_record_id);

alter table public.reply_intake enable row level security;
