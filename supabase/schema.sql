-- Public CRUD for the first version. Anyone who can reach the website can read,
-- insert, update, and delete these records. Restrict policies when auth is added.
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  location text not null default '',
  note text not null default '',
  accent text not null default 'pink',
  created_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Ăn uống',
  area text not null default '',
  dish text not null default '',
  map_url text not null default '',
  event_id uuid references public.events(id) on delete set null,
  visited boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.places enable row level security;
alter table public.checklist_items enable row level security;

drop policy if exists "public can read events" on public.events;
drop policy if exists "public can create events" on public.events;
drop policy if exists "public can update events" on public.events;
drop policy if exists "public can delete events" on public.events;
create policy "public can read events" on public.events for select to anon, authenticated using (true);
create policy "public can create events" on public.events for insert to anon, authenticated with check (true);
create policy "public can update events" on public.events for update to anon, authenticated using (true) with check (true);
create policy "public can delete events" on public.events for delete to anon, authenticated using (true);

drop policy if exists "public can read places" on public.places;
drop policy if exists "public can create places" on public.places;
drop policy if exists "public can update places" on public.places;
drop policy if exists "public can delete places" on public.places;
create policy "public can read places" on public.places for select to anon, authenticated using (true);
create policy "public can create places" on public.places for insert to anon, authenticated with check (true);
create policy "public can update places" on public.places for update to anon, authenticated using (true) with check (true);
create policy "public can delete places" on public.places for delete to anon, authenticated using (true);

drop policy if exists "public can read checklist" on public.checklist_items;
drop policy if exists "public can create checklist" on public.checklist_items;
drop policy if exists "public can update checklist" on public.checklist_items;
drop policy if exists "public can delete checklist" on public.checklist_items;
create policy "public can read checklist" on public.checklist_items for select to anon, authenticated using (true);
create policy "public can create checklist" on public.checklist_items for insert to anon, authenticated with check (true);
create policy "public can update checklist" on public.checklist_items for update to anon, authenticated using (true) with check (true);
create policy "public can delete checklist" on public.checklist_items for delete to anon, authenticated using (true);

create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists places_event_id_idx on public.places(event_id);
create index if not exists checklist_event_id_idx on public.checklist_items(event_id);
