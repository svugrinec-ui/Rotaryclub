import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// Zoekt de lotnummers van een naam, maar ALLEEN in de lopende (open) ronde.
export async function POST(req: Request) {
  let naam = '';
  try {
    naam = ((await req.json()).naam ?? '').toString().trim();
  } catch {
    /* leeg */
  }
  if (!naam) {
    return NextResponse.json({ error: 'Vul je naam in.' }, { status: 400 });
  }

  const sb = serviceClient();

  const { data: rondes } = await sb
    .from('rondes')
    .select('id, naam')
    .eq('status', 'open')
    .order('maand', { ascending: false })
    .limit(1);
  const ronde = rondes?.[0];
  if (!ronde) {
    return NextResponse.json(
      { error: 'Er is op dit moment geen open loterij.' },
      { status: 404 },
    );
  }

  const { data: loten } = await sb
    .from('loten')
    .select('lotnummer')
    .eq('ronde_id', ronde.id)
    .ilike('naam', naam) // hoofdletter-ongevoelig, exacte naam (geen wildcards)
    .order('lotnummer', { ascending: true });

  return NextResponse.json({
    ronde: ronde.naam,
    nummers: (loten ?? []).map((l) => l.lotnummer),
  });
}
