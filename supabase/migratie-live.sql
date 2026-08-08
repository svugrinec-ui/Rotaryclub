-- Migratie: live meekijken.
--  1. De maandmeter werkt bij zodra iemand loten koopt (realtime op `rondes`).
--  2. De trekking is live te volgen op ieders telefoon (`trekking_live`).
-- Draai dit één keer in de Supabase SQL-editor.

-- ---------------------------------------------------------------------------
-- 1. Live trekking: één rij per ronde met de stand van de trekking.
--    Bewust géén namenlijst: alleen de prijs die nu getrokken wordt en het
--    winnende lot. De pool met lotnummers laat de telefoons realistisch
--    "rollen" tijdens het trekken.
-- ---------------------------------------------------------------------------
create table if not exists public.trekking_live (
  ronde_id          uuid primary key references public.rondes(id) on delete cascade,
  fase              text not null default 'wachten',  -- wachten | rollen | onthuld | klaar
  prijs_label       text,
  prijs_index       int not null default 0,           -- 0-based
  prijs_totaal      int not null default 0,
  hoofdprijs        boolean not null default false,
  winnaar_lotnummer int,
  winnaar_naam      text,
  pool_nummers      int[] not null default '{}',
  bijgewerkt_op     timestamptz not null default now()
);

alter table public.trekking_live enable row level security;

-- Publiek leesbaar: iedereen mag de trekking volgen. Schrijven gebeurt
-- server-side met de service-role key achter het commissie-wachtwoord.
drop policy if exists "trekking publiek leesbaar" on public.trekking_live;
create policy "trekking publiek leesbaar" on public.trekking_live
  for select using (true);

-- ---------------------------------------------------------------------------
-- 2. Realtime: rondes (voor de maandmeter) en trekking_live (voor de trekking)
--    in de realtime-publicatie zetten. Idempotent.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array array['rondes', 'trekking_live'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
