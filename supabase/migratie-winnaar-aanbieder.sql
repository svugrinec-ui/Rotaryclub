-- Migratie: leg de aanbieder van de gewonnen experience vast bij de winnaar.
-- Draai dit één keer in de Supabase SQL-editor.

alter table public.winnaars
  add column if not exists aanbieder text;
