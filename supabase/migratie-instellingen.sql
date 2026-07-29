-- Eén-rij instellingen-tabel: penningmeester (naam + e-mail) en het
-- afzenderadres voor de export-mail. Beheerbaar vanuit het beheerscherm.
create table if not exists public.instellingen (
  id                   int primary key default 1 check (id = 1),
  penningmeester_naam  text,
  penningmeester_email text,
  afzender             text,
  updated_at           timestamptz not null default now()
);

insert into public.instellingen (id) values (1) on conflict (id) do nothing;

-- Bevat het penningmeester-adres → niet publiek leesbaar. Alleen server-side
-- (service role) leest/schrijft; geen select-policy voor anon.
alter table public.instellingen enable row level security;
