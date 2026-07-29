import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// Geeft de al vergeven lotnummers van een ronde terug (alleen de getallen, geen
// namen) zodat de "kies eigen nummers"-velden live kunnen aangeven wat bezet is.
export async function GET(req: Request) {
  const rondeId = new URL(req.url).searchParams.get('ronde_id');
  if (!rondeId) {
    return NextResponse.json({ error: 'Ronde ontbreekt.' }, { status: 400 });
  }

  const { data } = await serviceClient()
    .from('loten')
    .select('lotnummer')
    .eq('ronde_id', rondeId);

  return NextResponse.json({
    nummers: (data ?? []).map((l) => l.lotnummer as number),
  });
}
