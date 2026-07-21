import type { Winnaar, Doel } from './types';
import { maandLabel } from './format';

// Maanddoel: minimaal dit bedrag per maand ophalen voor het goede doel.
// Pas dit gerust aan.
export const MAANDDOEL = 400;

export interface Voortgang {
  opgehaald: number;
  doel: number;
  resterend: number;
  pct: number; // 0–100+ (kan boven 100 als het doel gehaald is)
  maandNaam: string; // bijv. "juli 2026"
  maandIso: string; // eerste-van-de-maand ISO, voor het koppelen van een goed doel
  weken: number; // aantal dinsdagen (loterijweken) in deze maand
  gehaald: boolean;
}

/** Aantal dinsdagen in de maand van de gegeven datum = het aantal loterijweken. */
function aantalDinsdagen(iso: string): number {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth();
  const laatsteDag = new Date(y, m + 1, 0).getDate();
  let n = 0;
  for (let dag = 1; dag <= laatsteDag; dag++) {
    if (new Date(y, m, dag).getDay() === 2) n++; // 2 = dinsdag
  }
  return n;
}

/** Kiest het goede doel dat bij een maand hoort; valt terug op het meest recente. */
export function doelVoorMaand(doelen: Doel[], maandIso: string): Doel | null {
  if (doelen.length === 0) return null;
  const key = maandIso.slice(0, 7);
  const match = doelen.find((d) => d.maand && d.maand.slice(0, 7) === key);
  if (match) return match;
  const metMaand = doelen.filter((d) => d.maand);
  if (metMaand.length > 0) {
    return metMaand.reduce((a, b) => (a.maand! > b.maand! ? a : b));
  }
  return doelen[0];
}

/**
 * Berekent de voortgang van de lopende loterijmaand: de som van de
 * weekopbrengsten in de meest recente maand met data, afgezet tegen het doel.
 */
export function maandVoortgang(
  winnaars: Pick<Winnaar, 'maand' | 'opbrengst'>[],
): Voortgang {
  const doel = MAANDDOEL;

  if (winnaars.length === 0) {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return {
      opgehaald: 0,
      doel,
      resterend: doel,
      pct: 0,
      maandNaam: maandLabel(iso),
      maandIso: iso,
      weken: aantalDinsdagen(iso),
      gehaald: false,
    };
  }

  const laatste = winnaars.reduce((m, w) => (w.maand > m ? w.maand : m), winnaars[0].maand);
  const key = laatste.slice(0, 7);
  const opgehaald = winnaars
    .filter((w) => w.maand.slice(0, 7) === key)
    .reduce((s, w) => s + Number(w.opbrengst ?? 0), 0);
  const pct = doel > 0 ? (opgehaald / doel) * 100 : 0;

  return {
    opgehaald,
    doel,
    resterend: Math.max(0, doel - opgehaald),
    pct,
    maandNaam: maandLabel(laatste),
    maandIso: laatste,
    weken: aantalDinsdagen(laatste),
    gehaald: opgehaald >= doel,
  };
}
