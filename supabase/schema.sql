create table if not exists public.covoit_journeys (
  participant_id text not null,
  journey_mode text not null check (journey_mode in ('outbound', 'return')),
  status text not null default 'unset' check (status in ('unset', 'offer', 'search')),
  date text not null default '',
  endpoint_city text not null default '',
  steps jsonb not null default '[]'::jsonb,
  message text not null default '',
  updated_at timestamptz not null default now(),
  primary key (participant_id, journey_mode)
);

alter table public.covoit_journeys
  add column if not exists message text not null default '';

alter table public.covoit_journeys enable row level security;

drop policy if exists "Allow public read journeys" on public.covoit_journeys;
create policy "Allow public read journeys"
  on public.covoit_journeys
  for select
  to anon
  using (true);

drop policy if exists "Allow public upsert journeys" on public.covoit_journeys;
create policy "Allow public upsert journeys"
  on public.covoit_journeys
  for insert
  to anon
  with check (true);

drop policy if exists "Allow public update journeys" on public.covoit_journeys;
create policy "Allow public update journeys"
  on public.covoit_journeys
  for update
  to anon
  using (true)
  with check (true);

do $$
begin
  alter publication supabase_realtime add table public.covoit_journeys;
exception
  when duplicate_object then null;
end $$;
