-- Toegepast op project Database V1 (vvvsvgtmslsjegbxppjf) op 25 november 2026.
-- Toegang volgt de centrale accounts (gebruikerslijst van de Collectiekeuze / startpagina).
-- De tabel kerstkaarten_2026.gebruikers uit de eerste migratie wordt niet meer gebruikt.
create or replace function kerstkaarten_2026.mag()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(public.is_blom(), false) $$;
revoke all on function kerstkaarten_2026.mag() from public, anon, authenticated;

-- de relatiegegevens zelf (sleutels: kaarten, uitleg, prijs, donatie), zodat ze niet in de pagina staan
create table kerstkaarten_2026.gegevens (
  sleutel       text primary key,
  data          jsonb not null,
  bijgewerkt_op timestamptz not null default now()
);
alter table kerstkaarten_2026.gegevens enable row level security;
revoke all on kerstkaarten_2026.gegevens from public, anon, authenticated;

create function public.kerstkaarten_2026_gegevens()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not kerstkaarten_2026.mag() then raise exception 'not_granted' using errcode = '42501'; end if;
  return coalesce((select jsonb_object_agg(sleutel, data) from kerstkaarten_2026.gegevens), '{}'::jsonb);
end $$;
revoke all on function public.kerstkaarten_2026_gegevens() from public, anon;
grant execute on function public.kerstkaarten_2026_gegevens() to authenticated;

-- De gegevens zijn eenmalig ingeladen via public.kerstkaarten_2026_inladen (met een geheime sleutel).
-- Die functie staat sindsdien dicht: ze doet niets meer en niemand mag haar aanroepen. Ze kan weg.
create or replace function public.kerstkaarten_2026_inladen(p_token text, p_sleutel text, p_data jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$ begin raise exception 'not_granted' using errcode = '42501'; end $$;
revoke all on function public.kerstkaarten_2026_inladen(text, text, jsonb) from public, anon, authenticated;
