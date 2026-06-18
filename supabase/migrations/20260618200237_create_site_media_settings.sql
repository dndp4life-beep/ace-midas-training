create table if not exists public.site_media_settings (
  slot text primary key,
  image_url text not null default '',
  alt_text text not null default '',
  object_position_x integer not null default 50 check (object_position_x between 0 and 100),
  object_position_y integer not null default 50 check (object_position_y between 0 and 100),
  zoom numeric not null default 1 check (zoom between 0.5 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_media_settings enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
