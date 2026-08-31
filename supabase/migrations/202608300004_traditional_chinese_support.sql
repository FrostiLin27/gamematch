-- Track Traditional Chinese support by content type instead of one generic language label.
alter table public.games
  add column if not exists traditional_chinese_interface boolean not null default false;
alter table public.games
  add column if not exists traditional_chinese_subtitles boolean not null default false;
alter table public.games
  add column if not exists traditional_chinese_voice boolean not null default false;

-- Existing records only recorded a generic Traditional Chinese language value.
-- Treat that legacy value as text support; voice support remains conservative until verified.
update public.games
set traditional_chinese_interface = true,
    traditional_chinese_subtitles = true
where languages @> array['繁體中文']::text[];
