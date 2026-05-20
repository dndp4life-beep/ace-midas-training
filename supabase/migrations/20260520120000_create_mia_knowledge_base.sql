create table if not exists public.mia_knowledge_base_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  question text,
  approved_answer text not null,
  keywords text[] not null default '{}'::text[],
  source text,
  status text not null default 'approved',
  last_updated date,
  priority integer not null default 50,
  confidence_threshold numeric not null default 35,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mia_knowledge_base_entries_category_title_key unique (category, title)
);

create index if not exists mia_kb_entries_status_idx
  on public.mia_knowledge_base_entries (status);

create index if not exists mia_kb_entries_category_idx
  on public.mia_knowledge_base_entries (category);

create index if not exists mia_kb_entries_priority_idx
  on public.mia_knowledge_base_entries (priority desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mia_knowledge_base_entries_category_title_key'
      and conrelid = 'public.mia_knowledge_base_entries'::regclass
  ) then
    alter table public.mia_knowledge_base_entries
      add constraint mia_knowledge_base_entries_category_title_key unique (category, title);
  end if;
end
$$;

create table if not exists public.mia_visitor_questions (
  id uuid primary key default gen_random_uuid(),
  visitor_question text not null,
  mia_answer text not null,
  matched_knowledge_base_entries jsonb not null default '[]'::jsonb,
  confidence_score numeric not null default 0,
  was_answered boolean not null default false,
  needs_review boolean not null default true,
  visitor_name text,
  organisation text,
  email text,
  phone text,
  course_interest text,
  number_of_participants text,
  location text,
  preferred_dates text,
  urgency text,
  notes text,
  status text not null default 'New enquiry',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mia_visitor_questions_status_idx
  on public.mia_visitor_questions (status);

create index if not exists mia_visitor_questions_needs_review_idx
  on public.mia_visitor_questions (needs_review);

create index if not exists mia_visitor_questions_created_at_idx
  on public.mia_visitor_questions (created_at desc);

create index if not exists mia_visitor_questions_email_idx
  on public.mia_visitor_questions (email);

alter table public.mia_knowledge_base_entries enable row level security;
alter table public.mia_visitor_questions enable row level security;
