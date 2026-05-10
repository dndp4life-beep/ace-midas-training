create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  agent_name text default 'Nia',
  content_type text,
  platform text,
  target_audience text,
  title text,
  content text,
  suggested_visual text,
  call_to_action text,
  hashtags text,
  tone text,
  status text default 'draft',
  topic text,
  created_at timestamptz default now(),
  used_at timestamptz
);

create index if not exists content_drafts_created_at_idx
on public.content_drafts (created_at desc);

create index if not exists content_drafts_status_idx
on public.content_drafts (status);
