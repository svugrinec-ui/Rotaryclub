import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import type { TrekkingFase } from '@/lib/types';

export const runtime = 'nodejs';

const FASES: TrekkingFase[] = ['wachten', 'rollen', 'onthuld', 'klaar'];

interface Body {
  ronde_id?: string;
  fase?: string;
  prijs_label?: string | null;
  prijs_index?: number;
  prijs_totaal?: number;
  hoofdprijs?: boolean;
  winnaar_lotnummer?: number | null;
  winnaar_naam?: string | null;
  pool_nummers?: number[];
}

/**
 * Zet de stand van de live trekking. Alleen de beheerder schrijft hier; de
 * publieke pagina /live leest dezelfde rij mee via Realtime, zodat alle
 * telefoons in de zaal hetzelfde moment zien.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const rondeId = body.ronde_id;
  const fase = body.fase as TrekkingFase | undefined;
  if (!rondeId || !fase || !FASES.includes(fase)) {
    return NextResponse.json({ error: 'Ronde of fase ontbreekt.' }, { status: 400 });
  }

  const rij: Record<string, unknown> = {
    ronde_id: rondeId,
    fase,
    prijs_label: body.prijs_label ?? null,
    prijs_index: Number(body.prijs_index ?? 0),
    prijs_totaal: Number(body.prijs_totaal ?? 0),
    hoofdprijs: Boolean(body.hoofdprijs),
    winnaar_lotnummer: body.winnaar_lotnummer ?? null,
    winnaar_naam: body.winnaar_naam ?? null,
    bijgewerkt_op: new Date().toISOString(),
  };
  // De pool sturen we alleen mee bij de start; daarna blijft die staan.
  if (Array.isArray(body.pool_nummers)) {
    rij.pool_nummers = body.pool_nummers.map((n) => Number(n)).filter(Number.isFinite);
  }

  const { error } = await serviceClient()
    .from('trekking_live')
    .upsert(rij, { onConflict: 'ronde_id' });

  if (error) {
    return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
