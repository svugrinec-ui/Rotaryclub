import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/supabase';
import type { TrekkingLive } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * De actuele stand van de trekking. Realtime is de hoofdweg; dit endpoint is
 * het vangnet voor telefoons waar websockets niet doorkomen (gastennetwerk),
 * en het vult de pagina bij het openen.
 */
export async function GET() {
  const sb = publicClient();
  const { data } = await sb
    .from('trekking_live')
    .select('*')
    .order('bijgewerkt_op', { ascending: false })
    .limit(1);

  const stand = ((data as TrekkingLive[] | null) ?? [])[0] ?? null;
  let rondeNaam: string | null = null;
  if (stand) {
    const { data: ronde } = await sb
      .from('rondes')
      .select('naam')
      .eq('id', stand.ronde_id)
      .single();
    rondeNaam = (ronde as { naam: string } | null)?.naam ?? null;
  }

  return NextResponse.json(
    { stand, rondeNaam },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
