-- Bewerkbare mailteksten voor de export-mail (intro + afsluiting), beheerbaar
-- vanuit het beheerscherm. Leeg = de standaardteksten uit de app.
alter table public.instellingen
  add column if not exists mail_intro      text,
  add column if not exists mail_afsluiting text;
