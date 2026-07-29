import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';
import { bundelVoorBedrag } from '@/lib/bundels';

export const runtime = 'nodejs';

interface Body {
  ronde_id?: string;
  naam?: string;
  contact?: string | null;
  bedrag?: number;
  betaalwijze?: string;
  nummers?: number[]; // optioneel: zelf gekozen lotnummers
}

// Willekeurige lotnummers uit een ruime range, zodat ze aanvoelen als echte
// loten (niet 1, 2, 3…). De unique-constraint in de DB is de vangnet.
const MIN = 100;
const MAX = 9999;

function randomNummers(aantal: number, gebruikt: Set<number>): number[] {
  const nieuw: number[] = [];
  let pogingen = 0;
  while (nieuw.length < aantal && pogingen < aantal * 200) {
    pogingen++;
    const n = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
    if (!gebruikt.has(n)) {
      gebruikt.add(n);
      nieuw.push(n);
    }
  }
  return nieuw;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const rondeId = body.ronde_id;
  const naam = (body.naam ?? '').trim();
  const contact = (body.contact ?? '')?.toString().trim() || null;
  const bundel = bundelVoorBedrag(Number(body.bedrag));
  const betaalwijze = body.betaalwijze === 'cash' ? 'cash' : 'bank';

  if (!rondeId || !naam) {
    return NextResponse.json(
      { error: 'Naam en ronde zijn verplicht.' },
      { status: 400 },
    );
  }
  if (!bundel) {
    return NextResponse.json({ error: 'Ongeldige bundel gekozen.' }, { status: 400 });
  }

  const sb = serviceClient();

  const { data: ronde, error: rErr } = await sb
    .from('rondes')
    .select('id, status')
    .eq('id', rondeId)
    .single();
  if (rErr || !ronde) {
    return NextResponse.json({ error: 'Ronde niet gevonden.' }, { status: 404 });
  }
  if (ronde.status !== 'open') {
    return NextResponse.json(
      { error: 'Deze loterijronde is niet meer open.' },
      { status: 409 },
    );
  }

  // De bezoeker bevestigt "ik heb betaald" vóór dit punt, dus het lot doet
  // meteen mee met de trekking. De commissie kan dit later terugdraaien.
  // Verdeel het bundelbedrag exact (in centen) over de loten.
  const totaalCenten = Math.round(bundel.bedrag * 100);
  const basis = Math.floor(totaalCenten / bundel.loten);
  const rest = totaalCenten - basis * bundel.loten;
  const bouwRijen = (nummers: number[]) => {
    const nu = new Date().toISOString();
    return nummers.map((n, i) => ({
      ronde_id: rondeId,
      lotnummer: n,
      naam,
      contact,
      betaald: true,
      betaald_op: nu,
      bedrag: (i < rest ? basis + 1 : basis) / 100,
      betaalwijze,
    }));
  };

  // Zelf gekozen lotnummers?
  const eigen = Array.isArray(body.nummers) ? body.nummers.map((n) => Number(n)) : null;
  if (eigen) {
    if (eigen.length !== bundel.loten) {
      return NextResponse.json(
        { error: `Kies precies ${bundel.loten} lotnummers voor deze bundel.` },
        { status: 400 },
      );
    }
    if (eigen.some((n) => !Number.isInteger(n) || n < 1 || n > 9999)) {
      return NextResponse.json(
        { error: 'Lotnummers moeten hele getallen tussen 1 en 9999 zijn.' },
        { status: 400 },
      );
    }
    if (new Set(eigen).size !== eigen.length) {
      return NextResponse.json(
        { error: 'Je hebt een dubbel lotnummer gekozen.' },
        { status: 400 },
      );
    }
    const nummers = [...eigen].sort((a, b) => a - b);
    const { error: insErr } = await sb.from('loten').insert(bouwRijen(nummers));
    if (insErr) {
      if (insErr.code === '23505') {
        return NextResponse.json(
          { error: 'Eén of meer van je gekozen nummers zijn al vergeven. Kies andere.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: 'Inschrijven mislukt. Probeer het nog eens.' },
        { status: 500 },
      );
    }
    return NextResponse.json({ nummers, bedrag: bundel.bedrag });
  }

  // Anders: willekeurige nummers. Bij gelijktijdige inschrijvingen kan een
  // nummer net vergeven zijn; dan proberen we het opnieuw met verse nummers.
  for (let poging = 0; poging < 5; poging++) {
    const { data: bestaande } = await sb
      .from('loten')
      .select('lotnummer')
      .eq('ronde_id', rondeId);

    const gebruikt = new Set<number>(
      (bestaande ?? []).map((r) => r.lotnummer as number),
    );
    const nummers = randomNummers(bundel.loten, gebruikt);
    if (nummers.length < bundel.loten) {
      return NextResponse.json(
        { error: 'Kon niet genoeg vrije lotnummers vinden. Meld dit bij de commissie.' },
        { status: 500 },
      );
    }
    // Oplopend sorteren zodat de weergave altijd dezelfde volgorde heeft als
    // het later opzoeken (dat ook oplopend sorteert).
    nummers.sort((a, b) => a - b);

    const { error: insErr } = await sb.from('loten').insert(bouwRijen(nummers));
    if (!insErr) {
      return NextResponse.json({ nummers, bedrag: bundel.bedrag });
    }
    if (insErr.code !== '23505') {
      return NextResponse.json(
        { error: 'Inschrijven mislukt. Probeer het nog eens.' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: 'Te druk op dit moment. Probeer het zo nog eens.' },
    { status: 503 },
  );
}
