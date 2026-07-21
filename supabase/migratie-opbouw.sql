-- Migratie: opbrengst per loterijweek vastleggen bij de winnaar.
-- Draai dit één keer in de Supabase SQL-editor.
--
-- Eén winnaar = één wekelijkse loterij (di 7 / 14 / 21 juli, enz.). Door de
-- weekopbrengst hier vast te leggen, kan het overzicht de opbouw tonen:
-- per week een bedrag én een oplopend totaal ("tot nu toe").

alter table public.winnaars
  add column if not exists opbrengst numeric(10,2) not null default 0;
