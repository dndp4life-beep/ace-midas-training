insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'training-evidence',
  'training-evidence',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.training_evidence (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  member_id uuid references public.members(id) on delete cascade,
  training_record_id uuid references public.training_records(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now()
);

create index if not exists training_evidence_training_record_id_idx on public.training_evidence(training_record_id);
create index if not exists training_evidence_member_id_idx on public.training_evidence(member_id);
create index if not exists training_evidence_organisation_id_idx on public.training_evidence(organisation_id);
create index if not exists training_evidence_uploaded_at_idx on public.training_evidence(uploaded_at desc);

alter table public.training_evidence enable row level security;
