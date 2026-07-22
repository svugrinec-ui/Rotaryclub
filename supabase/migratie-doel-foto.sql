-- Migratie: teaser-foto bij een goed doel.
-- Draai dit één keer in de Supabase SQL-editor.

alter table public.doelen
  add column if not exists foto_url text;
