-- De opbrengst hoort bij de RONDE, niet bij de winnaar. Zo telt een afgesloten
-- ronde altijd mee in het totaal — ook zonder gepubliceerde winnaar.

-- 1) Kolom: de som van de betaalde loten van de ronde.
alter table public.rondes
  add column if not exists opbrengst numeric not null default 0;

-- 2) Backfill: vul de bestaande rondes met de som van hun betaalde loten.
update public.rondes r
set opbrengst = coalesce((
  select sum(l.bedrag)
  from public.loten l
  where l.ronde_id = r.id
    and l.betaald = true
), 0);

-- 3) Publiek leesbaar maken: de goede-doelen-pagina en de homepage-meter lezen
--    voortaan de (afgesloten) rondes. Loten blijven privé; alleen de ronderegel
--    met naam/maand/status/opbrengst is publiek.
drop policy if exists "open rondes leesbaar" on public.rondes;
drop policy if exists "rondes publiek leesbaar" on public.rondes;
create policy "rondes publiek leesbaar" on public.rondes
  for select using (true);
