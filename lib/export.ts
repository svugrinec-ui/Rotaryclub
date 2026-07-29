import type { Ronde, Lot } from './types';

// CSV-veld veilig maken (Excel, puntkomma-gescheiden zoals in NL gebruikelijk).
function veld(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function euroKomma(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function dutchDatumTijd(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(iso));
}

/**
 * Bouwt het financiële overzicht als CSV: één regel per inschrijving (loten die
 * samen zijn aangemaakt), met bedrag, bank/contant en betaald-status. `loten`
 * is al gefilterd op de gewenste rondes.
 */
export function financieelCsv(rondes: Ronde[], loten: Lot[]): string {
  const rondeById = new Map(rondes.map((r) => [r.id, r]));

  interface Reg {
    ronde: string;
    datum: string;
    naam: string;
    aantal: number;
    nummers: number[];
    bedrag: number;
    betaalwijze: string;
    betaaldCount: number;
    ingeschreven: string;
  }
  const map = new Map<string, Reg>();
  for (const l of loten) {
    const r = rondeById.get(l.ronde_id);
    const key = `${l.ronde_id}|${l.naam}|${l.created_at}`;
    const reg =
      map.get(key) ??
      {
        ronde: r?.naam ?? '',
        datum: (r?.maand ?? '').slice(0, 10),
        naam: l.naam,
        aantal: 0,
        nummers: [],
        bedrag: 0,
        betaalwijze: l.betaalwijze === 'cash' ? 'contant' : 'bank',
        betaaldCount: 0,
        ingeschreven: l.created_at,
      };
    reg.aantal += 1;
    reg.nummers.push(l.lotnummer);
    reg.bedrag += Number(l.bedrag ?? 0);
    if (l.betaald) reg.betaaldCount += 1;
    map.set(key, reg);
  }

  const regels = [...map.values()].sort(
    (a, b) => a.datum.localeCompare(b.datum) || a.naam.localeCompare(b.naam),
  );

  const kop = [
    'Ronde',
    'Datum',
    'Naam',
    'Aantal loten',
    'Lotnummers',
    'Bedrag (EUR)',
    'Betaalwijze',
    'Betaald',
    'Ingeschreven op',
  ];
  const rijen = regels.map((r) =>
    [
      r.ronde,
      r.datum,
      r.naam,
      r.aantal,
      r.nummers.sort((a, b) => a - b).join(' '),
      euroKomma(Math.round(r.bedrag * 100) / 100),
      r.betaalwijze,
      r.betaaldCount === r.aantal ? 'ja' : r.betaaldCount === 0 ? 'nee' : 'deels',
      dutchDatumTijd(r.ingeschreven),
    ]
      .map(veld)
      .join(';'),
  );

  // ﻿ = BOM zodat Excel de accenten (é) goed leest.
  return '﻿' + [kop.map(veld).join(';'), ...rijen].join('\r\n') + '\r\n';
}

export function exportBestandsnaam(datumIso: string): string {
  return `rotary-financieel-overzicht-${datumIso.slice(0, 10)}.csv`;
}
