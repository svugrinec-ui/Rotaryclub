-- Migratie: koppel een goed doel aan een maand, zodat op de home- en
-- meedoen-pagina het juiste (actuele) goede doel getoond kan worden.
-- Draai dit één keer in de Supabase SQL-editor.

alter table public.doelen
  add column if not exists maand date;
