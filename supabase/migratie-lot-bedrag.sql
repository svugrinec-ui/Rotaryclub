-- Migratie: leg het betaalde bedrag per lot vast, zodat je de opbrengst van
-- een ronde (de week) direct kunt optellen. Draai dit één keer in de SQL-editor.
--
-- Het bundelbedrag wordt bij inschrijving over de losse loten verdeeld (in hele
-- centen), zodat de som per aankoop exact klopt.

alter table public.loten
  add column if not exists bedrag numeric(8,2) not null default 0;
