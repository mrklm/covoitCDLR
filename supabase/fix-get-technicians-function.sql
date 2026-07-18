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
  if encode(extensions.digest(access_password, 'sha256'), 'hex') <> '06fabe7992014b72287461d5a55221f209d6ac71781bae72cdb601a801b10185' then
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

grant execute on function public.get_technicians(text) to anon;
