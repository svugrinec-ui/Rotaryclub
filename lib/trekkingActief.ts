/**
 * Hoe lang een trekking-stand zonder nieuws hoogstens "bezig" blijft. Elke
 * stap van de commissie (starten, trekken, volgende prijs) zet de tijd opnieuw,
 * dus tijdens een echte trekking loopt dit nooit af. Blijft het stil — de
 * commissie klapt de laptop dicht, of het was een test — dan gaat de app weer
 * gewoon open in plaats van op slot te blijven.
 */
export const TREKKING_TIMEOUT_MS = 30 * 60 * 1000; // 30 minuten

/**
 * Is er op dit moment een trekking bezig? Zo ja, dan neemt de trekking het
 * scherm over en kunnen er géén loten meer bij.
 */
export function trekkingActief(
  stand: { fase: string; bijgewerkt_op: string } | null | undefined,
): boolean {
  if (!stand || stand.fase === 'klaar') return false;
  const ouderdom = Date.now() - new Date(stand.bijgewerkt_op).getTime();
  return Number.isFinite(ouderdom) ? ouderdom < TREKKING_TIMEOUT_MS : true;
}
