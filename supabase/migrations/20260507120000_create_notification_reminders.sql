create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  member_id uuid references public.members(id) on delete cascade,
  training_record_id uuid references public.training_records(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint notification_queue_status_check
    check (status in ('pending', 'sent', 'failed', 'cancelled'))
);

create index if not exists notification_queue_due_idx
  on public.notification_queue (status, scheduled_for);

create index if not exists notification_queue_training_record_idx
  on public.notification_queue (training_record_id);

create index if not exists notification_queue_member_idx
  on public.notification_queue (member_id);

create unique index if not exists notification_queue_pending_record_type_unique
  on public.notification_queue (training_record_id, type)
  where status = 'pending';

alter table public.notification_queue enable row level security;

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  training_record_id uuid references public.training_records(id) on delete set null,
  type text not null,
  recipient_email text,
  status text not null,
  provider_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notification_logs_training_record_idx
  on public.notification_logs (training_record_id);

create index if not exists notification_logs_created_at_idx
  on public.notification_logs (created_at desc);

alter table public.notification_logs enable row level security;
