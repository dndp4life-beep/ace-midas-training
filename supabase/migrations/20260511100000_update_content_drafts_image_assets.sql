alter table public.content_drafts
  add column if not exists image_prompt text,
  add column if not exists visual_style text,
  add column if not exists image_status text default 'not_started',
  add column if not exists image_path text,
  add column if not exists image_file_name text;

create index if not exists content_drafts_image_status_idx
on public.content_drafts (image_status);

insert into storage.buckets (id, name, public)
values ('content-assets', 'content-assets', false)
on conflict (id) do nothing;
