import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  let rondeId = '';
  try {
    rondeId = (await req.json()).ronde_id ?? '';
  } catch {
    /* leeg */
  }
  if (!rondeId) {
    return NextResponse.json({ error: 'Ronde ontbreekt.' }, { status: 400 });
  }

  const sb = serviceClient();
  // Alleen betaalde loten doen mee met de trekking.
  const { data: loten, error } = await sb
    .from('loten')
    .select('lotnummer, naam')
    .eq('ronde_id', rondeId)
    .eq('betaald', true);

  if (error) {
    return NextResponse.json({ error: 'Kon loten niet ophalen.' }, { status: 500 });
  }
  if (!loten || loten.length === 0) {
    return NextResponse.json(
      { error: 'Er zijn nog geen betaalde loten om uit te trekken.' },
      { status: 409 },
    );
  }

  const gewonnen = loten[Math.floor(Math.random() * loten.length)];
  return NextResponse.json({
    lotnummer: gewonnen.lotnummer,
    naam: gewonnen.naam,
    aantal_betaald: loten.length,
  });
}
