import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/supabase';
import { maandVoortgang, doelVoorMaand, MAANDDOEL } from '@/lib/doel';
import { maandTotalen, huidigeEnVorige } from '@/lib/opbrengst';
import { maandLabel } from '@/lib/format';
import type { Ronde, Winnaar, Doel } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * De actuele stand van de maandmeter. Bewust ongecached: de publieke pagina's
 * halen dit op zodra er loten verkocht worden, zodat de meter tijdens de
 * loterijavond live meeloopt.
 * `maand` (optioneel, "YYYY-MM-DD") houdt de meter op de maand van de ronde
 * waar de bezoeker naar kijkt, net als op de meedoen-pagina.
 */
export async function GET(req: Request) {
  const maandParam = new URL(req.url).searchParams.get('maand');
  const sb = publicClient();

  const [{ data: rondesData }, { data: winnaarsData }, { data: doelenData }] =
    await Promise.all([
      sb.from('rondes').select('*'),
      sb.from('winnaars').select('maand,opbrengst,ronde_id').eq('gepubliceerd', true),
      sb.from('doelen').select('*'),
    ]);

  const rondes = (rondesData as Ronde[] | null) ?? [];
  const winnaars =
    (winnaarsData as Pick<Winnaar, 'maand' | 'opbrengst' | 'ronde_id'>[] | null) ?? [];
  const doelen = (doelenData as Doel[] | null) ?? [];

  const maanden = maandTotalen(rondes, winnaars);
  const { huidig, vorig } = huidigeEnVorige(
    maanden,
    new Date().toISOString().slice(0, 7),
  );
  const voortgang = maandVoortgang(
    huidig ? [{ maand: huidig.maandIso, opbrengst: huidig.opbrengst }] : [],
  );
  const doel = doelVoorMaand(doelen, maandParam ?? voortgang.maandIso);
  const vorige = vorig
    ? {
        maandNaam: maandLabel(vorig.maandIso),
        opgehaald: vorig.opbrengst,
        doel: MAANDDOEL,
      }
    : null;

  return NextResponse.json(
    { voortgang, doelNaam: doel?.naam ?? null, vorige },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
