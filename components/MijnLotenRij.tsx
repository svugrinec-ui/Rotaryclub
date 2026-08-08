/** "Jouw loten, Peter (7)" — hetzelfde kopje bij het kopen en bij de trekking. */
export function lotenTitel(aantal: number, naam?: string): string {
  return `${naam ? `Jouw loten, ${naam}` : 'Jouw loten'} (${aantal})`;
}

interface Props {
  nummers: number[];
  /** Kopje boven de rij (bijv. "Jouw loten, Peter (7)"). */
  titel?: string;
  /** Dit nummer is net getrokken: goud met een pop. */
  gewonnen?: number | null;
  /** Op een donkere achtergrond (lot-badge, live-scherm). */
  donker?: boolean;
  /** Groot, voor het moment dat je je loten krijgt. */
  groot?: boolean;
  /**
   * Tijdens de cijfer-voor-cijfer onthulling: de loten die het nog kunnen zijn.
   * De rest dimt weg, wat er nog in zit licht op. Laat weg buiten de trekking.
   */
  mogelijk?: number[] | null;
}

/**
 * Eén weergave voor lotnummers, overal hetzelfde: bij het kopen, bij het
 * opzoeken en tijdens de trekking. Zo herkent iedereen zijn eigen loten
 * meteen, en licht het getrokken nummer op in dezelfde vorm.
 */
export default function MijnLotenRij({
  nummers,
  titel,
  gewonnen = null,
  donker,
  groot,
  mogelijk = null,
}: Props) {
  return (
    <div className={`lot-blok${donker ? ' donker' : ''}`}>
      {titel && <div className="lot-blok-kop">{titel}</div>}
      <div className={`lot-rij${groot ? ' groot' : ''}`}>
        {nummers.map((n) => {
          const afgevallen = mogelijk !== null && !mogelijk.includes(n);
          const kansrijk = mogelijk !== null && !afgevallen && n !== gewonnen;
          return (
            <span
              key={n}
              className={`lot-chip${n === gewonnen ? ' gewonnen' : ''}${
                afgevallen ? ' af' : ''
              }${kansrijk ? ' kans' : ''}`}
            >
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}
