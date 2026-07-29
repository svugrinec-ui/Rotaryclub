-- Betaalwijze per lot: 'bank' (Rabobank-betaalverzoek, standaard) of 'cash'
-- (contant aan de commissie). Zo kun je in het overzicht cash apart van bank
-- zien — handig bij het afstemmen (cash zit niet op het bankafschrift).
alter table public.loten
  add column if not exists betaalwijze text not null default 'bank'
    check (betaalwijze in ('bank', 'cash'));
