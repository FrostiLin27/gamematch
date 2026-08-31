create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.games (
  id text primary key,
  source text not null default 'catalog' check (source in ('catalog', 'manual', 'steam', 'igdb')),
  external_id text,
  name_zh text not null,
  name_en text not null,
  description text not null default '',
  genres text[] not null default '{}'::text[],
  moods text[] not null default '{}'::text[],
  modes text[] not null default '{}'::text[],
  session text not null check (session in ('short', 'medium', 'long')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  art_style text[] not null default '{}'::text[],
  platforms text[] not null default '{}'::text[],
  price_type text not null check (price_type in ('free', 'paid')),
  price_range text not null default '',
  languages text[] not null default '{}'::text[],
  cover text not null default '✦',
  cover_class text not null default 'cover-sunset',
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source, external_id)
);

create index if not exists games_genres_idx on public.games using gin (genres);
create index if not exists games_moods_idx on public.games using gin (moods);
create index if not exists games_modes_idx on public.games using gin (modes);
create index if not exists games_platforms_idx on public.games using gin (platforms);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  genres text[] not null default '{}'::text[],
  moods text[] not null default '{}'::text[],
  modes text[] not null default '{}'::text[],
  session text check (session is null or session in ('short', 'medium', 'long')),
  difficulty text check (difficulty is null or difficulty in ('easy', 'medium', 'hard')),
  platforms text[] not null default '{}'::text[],
  language_preferences text[] not null default array['語言不限']::text[],
  budget text not null default 'any' check (budget in ('free', 'paid', 'any')),
  avoid text[] not null default '{}'::text[],
  source text not null default 'questionnaire' check (source in ('questionnaire', 'free_text')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_feedback (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  status text not null check (status in ('disliked', 'neutral', 'liked')),
  rating smallint not null default 0 check (rating between 0 and 5),
  favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, game_id)
);

create table if not exists public.recommendation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null check (source in ('questionnaire', 'free_text')),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists recommendation_sessions_user_idx
  on public.recommendation_sessions (user_id, created_at desc);

create table if not exists public.recommendation_items (
  session_id uuid not null references public.recommendation_sessions(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  rank smallint not null check (rank > 0),
  score numeric not null default 0,
  reason text not null default '',
  primary key (session_id, game_id),
  unique (session_id, rank)
);

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at before update on public.games
  for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at before update on public.user_preferences
  for each row execute procedure public.set_updated_at();

drop trigger if exists game_feedback_set_updated_at on public.game_feedback;
create trigger game_feedback_set_updated_at before update on public.game_feedback
  for each row execute procedure public.set_updated_at();

alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.game_feedback enable row level security;
alter table public.recommendation_sessions enable row level security;
alter table public.recommendation_items enable row level security;

drop policy if exists "games are readable by everyone" on public.games;
create policy "games are readable by everyone"
  on public.games for select
  to anon, authenticated
  using (true);

drop policy if exists "users can read their profile" on public.profiles;
create policy "users can read their profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users can update their profile" on public.profiles;
create policy "users can update their profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users can manage their preferences" on public.user_preferences;
create policy "users can manage their preferences"
  on public.user_preferences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage their game feedback" on public.game_feedback;
create policy "users can manage their game feedback"
  on public.game_feedback for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage their recommendation sessions" on public.recommendation_sessions;
create policy "users can manage their recommendation sessions"
  on public.recommendation_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can read their recommendation items" on public.recommendation_items;
create policy "users can read their recommendation items"
  on public.recommendation_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.recommendation_sessions session
      where session.id = recommendation_items.session_id
        and session.user_id = auth.uid()
    )
  );

drop policy if exists "users can create recommendation items" on public.recommendation_items;
create policy "users can create recommendation items"
  on public.recommendation_items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.recommendation_sessions session
      where session.id = recommendation_items.session_id
        and session.user_id = auth.uid()
    )
  );
