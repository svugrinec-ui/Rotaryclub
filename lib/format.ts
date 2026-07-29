export function euro(bedrag: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: bedrag % 1 === 0 ? 0 : 2,
  }).format(bedrag);
}

export function maandLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat('nl-NL', {
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Rotary-bestuursjaar (juli–juni) voor een datum, bijv. "2026–2027". */
export function bestuursjaar(isoDate: string): {
  start: number;
  eind: number;
  label: string;
} {
  const d = new Date(isoDate);
  const start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; // 6 = juli
  return { start, eind: start + 1, label: `${start}–${start + 1}` };
}

/** Volledige datum, bijv. "di 7 juli 2026" — maakt de wekelijkse trekking duidelijk. */
export function datumLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Datum + tijd in Nederlandse tijd, bijv. "29 jul 21:14" — voor inschrijfmomenten. */
export function tijdstipLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  }).format(d);
}
