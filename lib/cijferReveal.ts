'use client';

import { useEffect, useRef, useState } from 'react';

/** Tijd tussen twee cijfers van de onthulling. */
export const CIJFER_MS = 750;

/**
 * Onthult een lotnummer cijfer voor cijfer en geeft terug hoeveel cijfers er al
 * staan. Elk toestel doet dit zelf zodra de trekking het winnende lot doorgeeft:
 * ze beginnen op hetzelfde signaal, dus de zaal loopt gelijk — zonder dat er
 * vier keer per prijs iets over het netwerk hoeft.
 *
 * `sleutel` hoort per prijs te verschillen, zodat een volgende prijs opnieuw
 * vanaf nul opbouwt.
 */
export function useCijferOnthulling(
  nummer: number | null,
  sleutel: string | number,
  aan: boolean,
  /**
   * Wanneer de commissie de onthulling doorgaf (`bijgewerkt_op`). Wie de pagina
   * mid-onthulling opent, begint niet opnieuw maar stapt in waar de zaal is.
   * Alleen voor die eerste keer gebruikt: een onthulling die we zelf zien
   * binnenkomen loopt vanaf nul en is dus per definitie gelijk.
   */
  startTijd?: string | null,
): number {
  const [zichtbaar, setZichtbaar] = useState(0);
  const eersteKeer = useRef(true);

  useEffect(() => {
    if (!aan || nummer === null) {
      setZichtbaar(0);
      return;
    }
    const lengte = String(nummer).length;

    // Instappen waar de zaal is (alleen bij het openen van de pagina).
    let begin = 0;
    if (eersteKeer.current && startTijd) {
      const verstreken = Date.now() - new Date(startTijd).getTime();
      if (Number.isFinite(verstreken) && verstreken > CIJFER_MS) {
        begin = Math.min(lengte, Math.floor(verstreken / CIJFER_MS));
      }
    }
    eersteKeer.current = false;

    setZichtbaar(begin);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = begin + 1; i <= lengte; i++) {
      timers.push(setTimeout(() => setZichtbaar(i), (i - begin) * CIJFER_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [nummer, sleutel, aan, startTijd]);

  return zichtbaar;
}

/** De cijfers die al bekend zijn, bijv. "12" van 1255. */
export function cijferPrefix(nummer: number | null, zichtbaar: number): string {
  return nummer === null ? '' : String(nummer).slice(0, zichtbaar);
}

/** Wat er in beeld staat: bekende cijfers plus bolletjes voor de rest. */
export function cijferTekst(nummer: number | null, zichtbaar: number): string {
  if (nummer === null) return '••••';
  const heel = String(nummer);
  return heel.slice(0, zichtbaar) + '•'.repeat(Math.max(0, heel.length - zichtbaar));
}

/**
 * Kan dit lot nog het winnende lot zijn, gezien de cijfers tot nu toe?
 * Een lot met een ander aantal cijfers valt meteen af — dat kan het niet zijn.
 */
export function kanNogWinnen(lot: number, nummer: number | null, zichtbaar: number): boolean {
  if (nummer === null || zichtbaar === 0) return true;
  const heel = String(nummer);
  const eigen = String(lot);
  if (eigen.length !== heel.length) return false;
  return eigen.startsWith(heel.slice(0, zichtbaar));
}
