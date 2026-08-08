const KEY = 'rotary-loterij:mijn-loten';

/** Event waarop meelezers hun kopie verversen zodra deze opslag verandert. */
export const MIJN_LOTEN_EVENT = 'rotary-loterij:mijn-loten-gewijzigd';

export interface MijnLoten {
  ronde_id: string;
  naam: string;
  nummers: number[];
  /** Bedrag van de laatste aankoop, om het betaalscherm te kunnen herstellen. */
  bedrag?: number;
  /** Gekozen betaalwijze, zodat het scherm terugkomt zoals je het verliet. */
  betaalwijze?: 'bank' | 'cash';
  /** Heeft de bezoeker de betaalstap gezet (bankknop of contant gekozen)? */
  betaalGestart?: boolean;
}

/**
 * De loten van deze bezoeker, in de browser bewaard. Zo kan de live-trekking
 * de eigen nummers groot in beeld zetten zonder inlog of account.
 */
export function leesMijnLoten(rondeId?: string): MijnLoten | null {
  if (typeof window === 'undefined') return null;
  try {
    const ruw = window.localStorage.getItem(KEY);
    if (!ruw) return null;
    const data = JSON.parse(ruw) as MijnLoten;
    if (!data?.ronde_id || !Array.isArray(data.nummers)) return null;
    // Loten van een oudere ronde zijn niet meer interessant.
    if (rondeId && data.ronde_id !== rondeId) return null;
    return data;
  } catch {
    return null;
  }
}

/** Bewaart de loten; bijkopen op dezelfde naam vult de lijst aan. */
export function bewaarMijnLoten(
  rondeId: string,
  naam: string,
  nummers: number[],
  bedrag?: number,
): void {
  if (typeof window === 'undefined') return;
  const bestaand = leesMijnLoten(rondeId);
  const zelfdeNaam =
    bestaand?.naam.trim().toLowerCase() === naam.trim().toLowerCase();
  const samen = zelfdeNaam
    ? [...new Set([...bestaand!.nummers, ...nummers])].sort((a, b) => a - b)
    : [...nummers].sort((a, b) => a - b);
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        ronde_id: rondeId,
        naam: naam.trim(),
        nummers: samen,
        bedrag: bedrag ?? (zelfdeNaam ? bestaand?.bedrag : undefined),
        // Nieuwe aankoop = weer te betalen; een andere naam begint schoon.
        betaalwijze: bedrag || !zelfdeNaam ? undefined : bestaand?.betaalwijze,
        betaalGestart: bedrag || !zelfdeNaam ? false : bestaand?.betaalGestart,
      }),
    );
  } catch {
    /* privémodus of volle opslag: dan tonen we straks gewoon de opzoek-knop */
  }
  // Andere onderdelen (de live-trekking) lezen dit uit hun eigen state; laat
  // weten dat er iets veranderd is, zodat ze niet met oude loten blijven staan.
  window.dispatchEvent(new Event(MIJN_LOTEN_EVENT));
}

/**
 * Legt vast dat de betaalstap gezet is (bankknop aangetikt of contant gekozen).
 * Daardoor komt de bezoeker na het betalen — of na een herstart van de app —
 * terug op de betaalstap in plaats van bij stap 1, en hoeft niemand zich af te
 * vragen of hij nu wel of geen loten heeft.
 */
export function bewaarBetaalStap(rondeId: string, wijze: 'bank' | 'cash'): void {
  if (typeof window === 'undefined') return;
  const bestaand = leesMijnLoten(rondeId);
  if (!bestaand) return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...bestaand, betaalwijze: wijze, betaalGestart: true }),
    );
  } catch {
    /* niets aan te doen */
  }
  window.dispatchEvent(new Event(MIJN_LOTEN_EVENT));
}

export function vergeetMijnLoten(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(MIJN_LOTEN_EVENT));
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* niets aan te doen */
  }
}
