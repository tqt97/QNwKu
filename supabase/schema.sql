-- Private shared planner schema. Browser access requires an authenticated member.
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

-- Shared reminder preferences and one Web Push subscription per device.
create table if not exists public.reminder_settings (
  id smallint primary key default 1 check (id = 1),
  reminder_times text[] not null default array['07:00']::text[],
  updated_at timestamptz not null default now()
);

-- Replace the earlier invalid subquery-based check constraint, if present.
alter table public.reminder_settings drop constraint if exists reminder_times_valid;
alter table public.reminder_settings drop constraint if exists reminder_times_limit;
alter table public.reminder_settings drop constraint if exists reminder_times_format;
alter table public.reminder_settings add constraint reminder_times_limit check (cardinality(reminder_times) <= 8);
alter table public.reminder_settings add constraint reminder_times_format check (
  reminder_times = '{}'::text[] or
  array_to_string(reminder_times, ',') ~ '^([01][0-9]|2[0-3]):[0-5][0-9](,([01][0-9]|2[0-3]):[0-5][0-9])*$'
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  local_date date not null,
  reminder_time text not null,
  created_at timestamptz not null default now(),
  unique (subscription_id, event_id, local_date, reminder_time)
);

-- Enable live row changes for the three planner lists.
do $realtime$
declare
  target_table text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;

  foreach target_table in array array['events', 'places', 'checklist_items', 'reminder_settings'] loop
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
alter table public.reminder_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_deliveries enable row level security;

revoke all on public.events, public.places, public.checklist_items, public.planner_members from anon, public;
revoke all on public.reminder_settings, public.push_subscriptions, public.reminder_deliveries from anon, authenticated, public;
grant select, insert, update, delete on public.events, public.places, public.checklist_items to authenticated;
grant select on public.planner_members to authenticated;
grant select, insert, update, delete on public.reminder_settings, public.push_subscriptions to authenticated;
grant all on public.reminder_deliveries to service_role;

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

drop policy if exists "planner members can manage reminder settings" on public.reminder_settings;
create policy "planner members can manage reminder settings" on public.reminder_settings for all to authenticated
  using (exists (select 1 from public.planner_members where user_id = (select auth.uid())))
  with check (exists (select 1 from public.planner_members where user_id = (select auth.uid())));

drop policy if exists "planner members can manage push subscriptions" on public.push_subscriptions;
drop policy if exists "users manage own push subscriptions" on public.push_subscriptions;
create policy "users manage own push subscriptions" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.planner_members where user_id = (select auth.uid())));

-- Delivery records are only managed by the server using the service role.
create index if not exists reminder_deliveries_date_time_idx on public.reminder_deliveries(local_date, reminder_time);
insert into public.reminder_settings (id) values (1) on conflict (id) do nothing;

create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists places_event_id_idx on public.places(event_id);
create index if not exists checklist_event_id_idx on public.checklist_items(event_id);
