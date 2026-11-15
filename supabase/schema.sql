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

-- Only explicitly enrolled Supabase Auth users may access this shared planner.
create table if not exists public.planner_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Enable live row changes for the three planner lists.
do $realtime$
declare
  target_table text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;

  foreach target_table in array array['events', 'places', 'checklist_items'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end
$realtime$;

alter table public.events enable row level security;
alter table public.places enable row level security;
alter table public.checklist_items enable row level security;
alter table public.planner_members enable row level security;

revoke all on public.events, public.places, public.checklist_items, public.planner_members from anon, public;
grant select, insert, update, delete on public.events, public.places, public.checklist_items to authenticated;
grant select on public.planner_members to authenticated;

drop policy if exists "public can read events" on public.events;
drop policy if exists "public can create events" on public.events;
drop policy if exists "public can update events" on public.events;
drop policy if exists "public can delete events" on public.events;
drop policy if exists "planner members can manage events" on public.events;
create policy "planner members can manage events" on public.events for all to authenticated
  using (exists (select 1 from public.planner_members where user_id = (select auth.uid())))
  with check (exists (select 1 from public.planner_members where user_id = (select auth.uid())));

drop policy if exists "public can read places" on public.places;
drop policy if exists "public can create places" on public.places;
drop policy if exists "public can update places" on public.places;
drop policy if exists "public can delete places" on public.places;
drop policy if exists "planner members can manage places" on public.places;
create policy "planner members can manage places" on public.places for all to authenticated
  using (exists (select 1 from public.planner_members where user_id = (select auth.uid())))
  with check (exists (select 1 from public.planner_members where user_id = (select auth.uid())));

drop policy if exists "public can read checklist" on public.checklist_items;
drop policy if exists "public can create checklist" on public.checklist_items;
drop policy if exists "public can update checklist" on public.checklist_items;
drop policy if exists "public can delete checklist" on public.checklist_items;
drop policy if exists "planner members can manage checklist" on public.checklist_items;
create policy "planner members can manage checklist" on public.checklist_items for all to authenticated
  using (exists (select 1 from public.planner_members where user_id = (select auth.uid())))
  with check (exists (select 1 from public.planner_members where user_id = (select auth.uid())));

drop policy if exists "members can read own membership" on public.planner_members;
create policy "members can read own membership" on public.planner_members for select to authenticated
  using (user_id = (select auth.uid()));

create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists places_event_id_idx on public.places(event_id);
create index if not exists checklist_event_id_idx on public.checklist_items(event_id);
