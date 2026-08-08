-- Migratie: meerdere foto's per winnaar (carrousel in de galerij).
-- Draai dit één keer in de Supabase SQL-editor.

alter table public.winnaars
  add column if not exists foto_urls text[] not null default '{}';

-- Bestaande losse foto wordt de eerste foto van de reeks.
update public.winnaars
   set foto_urls = array[foto_url]
 where foto_url is not null
   and coalesce(array_length(foto_urls, 1), 0) = 0;
