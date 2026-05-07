create table if not exists public.report_history (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  report_type text not null,
  file_name text not null,
  generated_by text,
  status text not null default 'generated',
  created_at timestamptz not null default now()
);

create index if not exists report_history_created_at_idx on public.report_history(created_at desc);
create index if not exists report_history_organisation_id_idx on public.report_history(organisation_id);
create index if not exists report_history_report_type_idx on public.report_history(report_type);

alter table public.report_history enable row level security;
