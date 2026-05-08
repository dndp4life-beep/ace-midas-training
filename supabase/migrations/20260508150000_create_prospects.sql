create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  organisation_name text not null,
  website text,
  location text,
  sector text,
  likely_training_need text,
  contact_email text,
  phone text,
  decision_maker_name text,
  source_url text not null,
  notes text,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  relevance_reason text,
  review_status text not null default 'pending_review' check (review_status in ('pending_review', 'approved', 'rejected')),
  created_by_agent text not null default 'rory',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospects_priority_idx on public.prospects(priority);
create index if not exists prospects_review_status_idx on public.prospects(review_status);
create index if not exists prospects_created_at_idx on public.prospects(created_at desc);

alter table public.prospects enable row level security;
