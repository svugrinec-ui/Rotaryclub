import type { Ronde, Winnaar } from './types';

/** Eén loterijweek voor het publieke overzicht: het opgehaalde bedrag + (indien
 *  bekend) de winnaar en de experience. */
export interface Week {
  key: string;
  maand: string; // ISO date van de loterijavond
  opbrengst: number;
  naam: string | null;
  experience_titel: string | null;
  aanbieder: string | null;
  foto_url: string | null;
}

/**
 * Bouwt de loterijweken uit twee bronnen, zónder dubbeltellingen:
 *  1. Afgesloten/getrokken rondes — bedrag = de (automatische) ronde-opbrengst,
 *     dus een ronde telt mee zodra hij dicht is, ook zonder gepubliceerde winnaar.
 *  2. Oude winnaars die niet aan een ronde hangen — de met de hand ingevoerde
 *     weken van vóór de digitale loten.
 * Een winnaar die wél aan een ronde hangt, wordt via zijn ronde geteld (1), niet
 * los, zodat hetzelfde geld nooit dubbel meetelt.
 */
export function bouwWeken(rondes: Ronde[], winnaars: Winnaar[]): Week[] {
  const winnaarPerRonde = new Map<string, Winnaar>();
  for (const w of winnaars) if (w.ronde_id) winnaarPerRonde.set(w.ronde_id, w);

  const weken: Week[] = [];

  for (const r of rondes) {
    if (r.status !== 'gesloten' && r.status !== 'getrokken') continue;
    const bedrag = Number(r.opbrengst ?? 0);
    if (bedrag <= 0) continue;
    const w = winnaarPerRonde.get(r.id);
    weken.push({
      key: `r:${r.id}`,
      maand: r.maand,
      opbrengst: bedrag,
      naam: w?.naam ?? null,
      // Zonder gepubliceerde winnaar tonen we de naam van de ronde-avond.
      experience_titel: w?.experience_titel ?? r.naam,
      aanbieder: w?.aanbieder ?? null,
      foto_url: w?.foto_url ?? null,
    });
  }

  for (const w of winnaars) {
    if (w.ronde_id) continue; // ronde-gebonden weken zitten al hierboven
    const bedrag = Number(w.opbrengst ?? 0);
    if (bedrag <= 0) continue;
    weken.push({
      key: `w:${w.id}`,
      maand: w.maand,
      opbrengst: bedrag,
      naam: w.naam,
      experience_titel: w.experience_titel,
      aanbieder: w.aanbieder ?? null,
      foto_url: w.foto_url ?? null,
    });
  }

  return weken.sort((a, b) => a.maand.localeCompare(b.maand));
}

/** Totale opbrengst over alle weken. */
export function wekenTotaal(weken: Week[]): number {
  return Math.round(weken.reduce((s, w) => s + w.opbrengst, 0) * 100) / 100;
}
