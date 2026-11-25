-- Kerstkaarten 2026: aanpassingen en toegevoegde kaarten uit de pagina blominterieurs/kerstkaarten-2026.
-- Toegepast op project Database V1 (vvvsvgtmslsjegbxppjf) op 25 november 2026.
-- Alles staat in een eigen schema; de pagina leest en schrijft alleen via de twee functies in public.

create schema if not exists kerstkaarten_2026;
revoke all on schema kerstkaarten_2026 from public, anon, authenticated;

-- wie de kerstkaarten mag zien en aanpassen (naast de beheerders van de Collectiekeuze)
create table kerstkaarten_2026.gebruikers (
  email         text primary key check (email = lower(btrim(email)) and email like '%_@blominterieurs.nl'),
  naam          text,
  toegevoegd_op timestamptz not null default now()
);

-- per bestaande relatie: de aangepaste velden (cur) en de geschiedenis (hist)
create table kerstkaarten_2026.aangepaste_kaarten (
  id              text primary key check (id ~ '^[A-Za-z0-9_-]{1,60}$'),
  data            jsonb not null,
  bijgewerkt_op   timestamptz not null default now(),
  bijgewerkt_door text
);

-- relaties die in de pagina zijn toegevoegd (data.deleted = true betekent weer verwijderd)
create table kerstkaarten_2026.toegevoegde_kaarten (
  id              text primary key check (id ~ '^[A-Za-z0-9_-]{1,60}$'),
  data            jsonb not null,
  bijgewerkt_op   timestamptz not null default now(),
  bijgewerkt_door text
);

alter table kerstkaarten_2026.gebruikers          enable row level security;
alter table kerstkaarten_2026.aangepaste_kaarten  enable row level security;
alter table kerstkaarten_2026.toegevoegde_kaarten enable row level security;
revoke all on all tables in schema kerstkaarten_2026 from public, anon, authenticated;

create function kerstkaarten_2026.mag()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') like '%_@blominterieurs.nl', false)
     and (public.is_beheerder()
          or exists (select 1 from kerstkaarten_2026.gebruikers g where g.email = lower(auth.jwt() ->> 'email')))
$$;
revoke all on function kerstkaarten_2026.mag() from public, anon, authenticated;

-- alles in één keer lezen: { wijz: { id: data }, nieuw: { id: data } }
create function public.kerstkaarten_2026_lees()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not kerstkaarten_2026.mag() then raise exception 'not_granted' using errcode = '42501'; end if;
  return jsonb_build_object(
    'wijz',  coalesce((select jsonb_object_agg(id, data) from kerstkaarten_2026.aangepaste_kaarten),  '{}'::jsonb),
    'nieuw', coalesce((select jsonb_object_agg(id, data) from kerstkaarten_2026.toegevoegde_kaarten), '{}'::jsonb));
end $$;

-- één kaart opslaan. p_soort: 'wijz' of 'nieuw'. p_samenvoegen: velden toevoegen aan wat er al staat.
create function public.kerstkaarten_2026_zet(p_soort text, p_id text, p_data jsonb, p_samenvoegen boolean default false)
returns void language plpgsql security definer set search_path = ''
as $$
declare wie text := lower(auth.jwt() ->> 'email');
begin
  if not kerstkaarten_2026.mag() then raise exception 'not_granted' using errcode = '42501'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 200000 then
    raise exception 'ongeldige gegevens' using errcode = '22023';
  end if;
  if p_soort = 'wijz' then
    insert into kerstkaarten_2026.aangepaste_kaarten as k (id, data, bijgewerkt_door) values (p_id, p_data, wie)
    on conflict (id) do update set data = case when p_samenvoegen then k.data || excluded.data else excluded.data end,
      bijgewerkt_op = now(), bijgewerkt_door = wie;
  elsif p_soort = 'nieuw' then
    insert into kerstkaarten_2026.toegevoegde_kaarten as k (id, data, bijgewerkt_door) values (p_id, p_data, wie)
    on conflict (id) do update set data = case when p_samenvoegen then k.data || excluded.data else excluded.data end,
      bijgewerkt_op = now(), bijgewerkt_door = wie;
  else
    raise exception 'onbekende soort %', p_soort using errcode = '22023';
  end if;
end $$;

revoke all on function public.kerstkaarten_2026_lees(), public.kerstkaarten_2026_zet(text, text, jsonb, boolean) from public, anon;
grant execute on function public.kerstkaarten_2026_lees(), public.kerstkaarten_2026_zet(text, text, jsonb, boolean) to authenticated;

-- De tabel gebruikers is daarna vervangen door de centrale accounts (zie de volgende migratie).
