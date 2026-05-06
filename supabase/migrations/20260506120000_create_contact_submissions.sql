create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  organisation text,
  message text not null,
  source text default 'website',
  status text default 'new',
  created_at timestamptz default now()
);

alter table public.contact_submissions enable row level security;

comment on table public.contact_submissions is 'Website contact form submissions created by the contact-form Edge Function.';
