import type { Winnaar } from './types';

/**
 * De foto's van een winnaar, op volgorde. `foto_urls` is de bron; `foto_url`
 * blijft de eerste foto en vangt winnaars op van vóór de carrousel (en de
 * plekken die maar één foto tonen).
 */
export function winnaarFotos(
  w: Pick<Winnaar, 'foto_url' | 'foto_urls'>,
): string[] {
  const lijst = (w.foto_urls ?? []).filter(Boolean);
  if (lijst.length > 0) return lijst;
  return w.foto_url ? [w.foto_url] : [];
}
