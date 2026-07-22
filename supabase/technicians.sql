create extension if not exists pgcrypto;

create table if not exists public.technicians (
  id text primary key,
  last_name text not null,
  first_name text not null,
  pseudo text not null default '',
  city text not null,
  latitude double precision,
  longitude double precision,
  phone text not null,
  color text not null default '#2f6f8f',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.technicians
  add column if not exists pseudo text not null default '';

alter table public.technicians enable row level security;

drop policy if exists "No public read technicians" on public.technicians;
drop policy if exists "No public insert technicians" on public.technicians;
drop policy if exists "No public update technicians" on public.technicians;
drop policy if exists "No public delete technicians" on public.technicians;

drop function if exists public.get_technicians(text);
drop function if exists public.upsert_technician(
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  text
);
drop function if exists public.upsert_technician(
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  text
);

create or replace function public.get_technicians(access_password text)
returns table (
  id text,
  last_name text,
  first_name text,
  pseudo text,
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
  if encode(extensions.digest(access_password, 'sha256'), 'hex') <> '06fabe7992014b72287461d5a55221f209d6ac71781bae72cdb601a801b10185' then
    raise exception 'Invalid password';
  end if;

  return query
  select
    t.id,
    t.last_name,
    t.first_name,
    t.pseudo,
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

create or replace function public.upsert_technician(
  access_password text,
  technician_id text,
  last_name_value text,
  first_name_value text,
  pseudo_value text,
  city_value text,
  latitude_value double precision,
  longitude_value double precision,
  phone_value text,
  color_value text
)
returns table (
  id text,
  last_name text,
  first_name text,
  pseudo text,
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
declare
  resolved_technician_id text;
begin
  if encode(extensions.digest(access_password, 'sha256'), 'hex') <> '06fabe7992014b72287461d5a55221f209d6ac71781bae72cdb601a801b10185' then
    raise exception 'Invalid password';
  end if;

  select t.id
  into resolved_technician_id
  from public.technicians t
  where t.id = technician_id
  limit 1;

  if resolved_technician_id is null then
    select t.id
    into resolved_technician_id
    from public.technicians t
    where lower(trim(t.last_name)) = lower(trim(last_name_value))
      and lower(trim(t.first_name)) = lower(trim(first_name_value))
      and regexp_replace(t.phone, '\D', '', 'g') = regexp_replace(phone_value, '\D', '', 'g')
    order by t.created_at
    limit 1;
  end if;

  resolved_technician_id = coalesce(resolved_technician_id, technician_id);

  insert into public.technicians (
    id,
    last_name,
    first_name,
    pseudo,
    city,
    latitude,
    longitude,
    phone,
    color
  )
  values (
    resolved_technician_id,
    trim(last_name_value),
    trim(first_name_value),
    trim(pseudo_value),
    trim(city_value),
    latitude_value,
    longitude_value,
    trim(phone_value),
    color_value
  )
  on conflict on constraint technicians_pkey do update set
    last_name = excluded.last_name,
    first_name = excluded.first_name,
    pseudo = excluded.pseudo,
    city = excluded.city,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    phone = excluded.phone,
    color = excluded.color,
    updated_at = now();

  return query
  select
    t.id,
    t.last_name,
    t.first_name,
    t.pseudo,
    t.city,
    t.latitude,
    t.longitude,
    t.phone,
    t.color
  from public.technicians t
  where t.id = resolved_technician_id;
end;
$$;

grant execute on function public.upsert_technician(
  text,
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  text
) to anon;
