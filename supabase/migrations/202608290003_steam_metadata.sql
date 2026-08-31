-- Metadata returned by the Steam Store API for imported catalog entries.
alter table public.games add column if not exists cover_url text;
alter table public.games add column if not exists steam_url text;
alter table public.games add column if not exists release_date text;
alter table public.games add column if not exists metacritic_score smallint check (metacritic_score is null or metacritic_score between 0 and 100);

create index if not exists games_source_external_idx on public.games (source, external_id);
