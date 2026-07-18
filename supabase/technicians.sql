create extension if not exists pgcrypto;

create table if not exists public.technicians (
  id text primary key,
  last_name text not null,
  first_name text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  phone text not null,
  color text not null default '#2f6f8f',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.technicians enable row level security;

drop policy if exists "No public read technicians" on public.technicians;
drop policy if exists "No public insert technicians" on public.technicians;
drop policy if exists "No public update technicians" on public.technicians;
drop policy if exists "No public delete technicians" on public.technicians;

create or replace function public.get_technicians(access_password text)
returns table (
  id text,
  last_name text,
  first_name text,
  city text,
  latitude double precision,
  longitude double precision,
  phone text,
  color text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if encode(digest(access_password, 'sha256'), 'hex') <> '06fabe7992014b72287461d5a55221f209d6ac71781bae72cdb601a801b10185' then
    raise exception 'Invalid password';
  end if;

  return query
  select
    t.id,
    t.last_name,
    t.first_name,
    t.city,
    t.latitude,
    t.longitude,
    t.phone,
    t.color
  from public.technicians t
  order by t.last_name, t.first_name;
end;
$$;

revoke all on public.technicians from anon;
revoke all on public.technicians from authenticated;

grant execute on function public.get_technicians(text) to anon;
