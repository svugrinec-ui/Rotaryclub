import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// Werkt de betaalwijze (bank/cash) bij van de zojuist aangemaakte loten. De
// keuze valt op het betaalscherm (stap 3), ná het toekennen van de nummers.
export async function POST(req: Request) {
  let body: {
    ronde_id?: string;
    naam?: string;
    nummers?: number[];
    betaalwijze?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const ronde_id = body.ronde_id;
  const naam = (body.naam ?? '').trim();
  const nummers = Array.isArray(body.nummers)
    ? body.nummers.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : [];
  const betaalwijze = body.betaalwijze === 'cash' ? 'cash' : 'bank';

  if (!ronde_id || !naam || nummers.length === 0) {
    return NextResponse.json({ error: 'Onvolledige aanvraag.' }, { status: 400 });
  }

  const { error } = await serviceClient()
    .from('loten')
    .update({ betaalwijze })
    .eq('ronde_id', ronde_id)
    .eq('naam', naam)
    .in('lotnummer', nummers);

  if (error) {
    return NextResponse.json({ error: 'Bijwerken mislukt.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
