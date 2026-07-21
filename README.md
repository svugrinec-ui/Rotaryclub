# Rotary Experiences — Loterij Soest-Baarn

Een kleine webapp voor de dinsdagavondloterij van Rotary Club Soest-Baarn:

- **Winnaars-galerij** per maand, met foto's — je beste werving voor nieuwe Experiences.
- **Goede doelen & opbrengsten** — transparant overzicht met totaalteller.
- **Digitale loten** achter een QR-code: bezoekers schrijven zich in, de commissie
  vinkt betaalde loten af en trekt de winnaar. Geen papieren lootjes meer.

Gebouwd met Next.js (App Router) + Supabase. Betalen blijft via de bestaande QR;
de commissie vinkt betalingen af tegen het bankafschrift.

---

## 1. Supabase-project opzetten

1. Maak een gratis project op [supabase.com](https://supabase.com) (kies een
   EU-regio, bijv. Frankfurt).
2. Open **SQL Editor** → plak de inhoud van [`supabase/schema.sql`](supabase/schema.sql)
   → **Run**. Dit maakt alle tabellen, de beveiliging (RLS) en de foto-bucket aan.
3. Ga naar **Project Settings → API** en noteer:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (geheim! nooit publiek maken)

## 2. Lokaal draaien

```bash
cp .env.example .env.local     # vul je Supabase-gegevens + een admin-wachtwoord in
npm install
npm run dev                    # http://localhost:3200
```

Omgevingsvariabelen (zie `.env.example`):

| Variabele | Waarvoor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publieke, alleen-lezen key |
| `SUPABASE_SERVICE_ROLE_KEY` | geheime server-key (schrijfacties) |
| `ADMIN_PASSWORD` | wachtwoord voor `/beheer` |
| `ADMIN_SESSION_SECRET` | lange willekeurige string (`openssl rand -hex 32`) |

## 3. Deployen op Vercel

1. Zet de map in een Git-repo en importeer 'm in [Vercel](https://vercel.com).
2. Voeg dezelfde vijf omgevingsvariabelen toe onder **Settings → Environment Variables**.
3. Deploy. Klaar.

---

## Zo werkt het in de praktijk

**Voor de clubavond**
1. Log in op `/beheer` en maak een **ronde** aan (bijv. "Juli 2026").
2. Voeg de **experiences** toe die te winnen zijn.
3. Zet de ronde op **open**. De QR-code op tafel wijst naar `/meedoen`.

**Tijdens de avond**
4. Bezoeker scant de QR → `/meedoen` → vult naam + aantal loten in → krijgt direct
   het lotnummer op het scherm. Betalen doet-ie via de bestaande QR-code.

**Afvinken & trekken**
5. In `/beheer/ronde/[id]` vink je betaalde loten af tegen het bankafschrift.
6. Klik **Trek winnaar** — de app kiest willekeurig uit alle *betaalde* loten.
7. Leg de winnaar vast met een foto → verschijnt automatisch in de galerij.

**Goede doelen**
8. Werk in `/beheer` de opbrengsten per goed doel bij; de totaalteller staat op de
   homepage en op `/goede-doelen`.

---

## Beveiliging in het kort

- Publieke pagina's lezen via de **anon-key**; Row Level Security zorgt dat daar
  alleen publieke data uit komt (gepubliceerde winnaars, doelen, open ronde).
- De tabel `loten` is **niet** publiek leesbaar. Inschrijven en afvinken lopen
  volledig server-side.
- Alle schrijfacties gebeuren server-side met de **service-role key**, achter het
  commissie-wachtwoord (ondertekende cookie, 30 dagen geldig).

## Later uitbreiden

- **Volautomatisch koppelen** van betaling aan lotuitgifte kan met een
  betaaldienst met webhook (bijv. Mollie/iDEAL). De architectuur is daarop
  voorbereid: lotuitgifte zit al achter één server-route (`/api/loten`).
- QR-code genereren die naar `/meedoen` wijst (elke QR-generator volstaat).
