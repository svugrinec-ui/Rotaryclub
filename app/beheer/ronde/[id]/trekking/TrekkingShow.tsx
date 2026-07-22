'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { maakWinnaar } from '@/lib/actions';
import { IconTrophy } from '@/components/Icons';

interface Lot {
  lotnummer: number;
  naam: string;
}

interface Experience {
  titel: string;
  aanbieder: string | null;
}

interface Props {
  rondeId: string;
  rondeNaam: string;
  datum: string;
  experiences: Experience[];
  betaaldeLoten: Lot[];
}

interface Gewonnen {
  prijs: string;
  hoofdprijs: boolean;
  lot: Lot;
}

export default function TrekkingShow({
  rondeId,
  rondeNaam,
  datum,
  experiences,
  betaaldeLoten,
}: Props) {
  const deelnemers = new Set(betaaldeLoten.map((l) => l.naam)).size;
  // Er wordt per lot getrokken (elk lot wint hoogstens één keer); wie meer
  // loten heeft, maakt meer kans en kan dus meer dan één prijs winnen.
  const maxPrijzen = Math.max(1, Math.min(betaaldeLoten.length, 10));

  const [aantal, setAantal] = useState(Math.min(5, maxPrijzen));
  // De hoofdprijs (experience + aanbieder) komt uit de ronde — niet bewerkbaar hier.
  const hoofdprijs = experiences[0]?.titel ?? 'Hoofdprijs';
  const aanbieder = experiences[0]?.aanbieder ?? '';
  const [fase, setFase] = useState<'setup' | 'show' | 'klaar'>('setup');

  // --- tijdens de show ---
  const [prijzen, setPrijzen] = useState<{ label: string; hoofdprijs: boolean }[]>([]);
  const [index, setIndex] = useState(0);
  const [pool, setPool] = useState<Lot[]>([]);
  const [winnaars, setWinnaars] = useState<Gewonnen[]>([]);
  const [display, setDisplay] = useState<number | null>(null);
  const [cycling, setCycling] = useState(false);
  const [onthuld, setOnthuld] = useState<Lot | null>(null);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poolNums = betaaldeLoten.map((l) => l.lotnummer);

  function start() {
    // Onthullingsvolgorde: kleinste prijs eerst, hoofdprijs (experience) als climax.
    const lijst: { label: string; hoofdprijs: boolean }[] = [];
    for (let p = aantal; p >= 2; p--) lijst.push({ label: `${p}e prijs`, hoofdprijs: false });
    lijst.push({ label: hoofdprijs, hoofdprijs: true });
    setPrijzen(lijst);
    setPool([...betaaldeLoten]);
    setWinnaars([]);
    setIndex(0);
    setOnthuld(null);
    setDisplay(null);
    setFase('show');
  }

  function trek() {
    if (cycling || onthuld || pool.length === 0) return;
    const winnaar = pool[Math.floor(Math.random() * pool.length)];
    setCycling(true);

    let verstreken = 0;
    let delay = 45;
    const totaal = 2600;
    const tick = () => {
      setDisplay(poolNums[Math.floor(Math.random() * poolNums.length)]);
      verstreken += delay;
      if (verstreken >= totaal) {
        setDisplay(winnaar.lotnummer);
        setCycling(false);
        setOnthuld(winnaar);
        setPool((prev) => prev.filter((l) => l.lotnummer !== winnaar.lotnummer));
        setWinnaars((prev) => [
          ...prev,
          { prijs: prijzen[index].label, hoofdprijs: prijzen[index].hoofdprijs, lot: winnaar },
        ]);
        return;
      }
      if (verstreken > totaal * 0.65) delay += 16; // afremmen naar het einde
      timer.current = setTimeout(tick, delay);
    };
    tick();
  }

  function volgende() {
    setOnthuld(null);
    setDisplay(null);
    if (index + 1 >= prijzen.length) {
      setFase('klaar');
    } else {
      setIndex((i) => i + 1);
    }
  }

  // Winnaar accepteert niet: haal 'm uit de uitslag en trek opnieuw voor
  // DEZELFDE prijs. Het geweigerde lot is al uit de pool, dus het komt niet terug.
  function herkans() {
    setWinnaars((prev) => prev.slice(0, -1));
    setOnthuld(null);
    setDisplay(null);
  }

  function opnieuw() {
    if (timer.current) clearTimeout(timer.current);
    setFase('setup');
    setWinnaars([]);
    setOnthuld(null);
    setDisplay(null);
    setCycling(false);
    setOpgeslagen(false);
  }

  // ---------- Setup ----------
  if (fase === 'setup') {
    return (
      <>
        <p style={{ marginTop: 20 }}>
          <Link href={`/beheer/ronde/${rondeId}`}>← Terug naar ronde</Link>
        </p>
        <h1>Trekking — {rondeNaam}</h1>

        {experiences.length === 0 ? (
          <div className="notice notice-err">
            Deze ronde heeft nog geen hoofdprijs (experience + aanbieder). Voeg die
            eerst toe bij de{' '}
            <Link href={`/beheer/ronde/${rondeId}`}>ronde</Link>.
          </div>
        ) : betaaldeLoten.length === 0 ? (
          <div className="notice notice-err">
            Er zijn nog geen betaalde loten om uit te trekken. Vink eerst betalingen af.
          </div>
        ) : (
          <div className="panel">
            <p className="muted" style={{ marginTop: 0 }}>
              {betaaldeLoten.length} betaalde loten van {deelnemers} deelnemers.
              De hoofdprijs wordt als laatste getrokken.
            </p>

            <label>Aantal prijzen</label>
            <div className="row-actions" style={{ marginBottom: 6 }}>
              {[3, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn ${aantal === n ? '' : 'btn-ghost'}`}
                  onClick={() => setAantal(Math.min(n, maxPrijzen))}
                  disabled={n > maxPrijzen}
                >
                  {n} prijzen
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={maxPrijzen}
                value={aantal}
                onChange={(e) =>
                  setAantal(Math.max(1, Math.min(maxPrijzen, Number(e.target.value) || 1)))
                }
                style={{ maxWidth: 90 }}
              />
            </div>
            {maxPrijzen < aantal && (
              <p className="muted">Er zijn maar {maxPrijzen} deelnemers.</p>
            )}

            <label>Hoofdprijs</label>
            <div className="trekking-hoofdprijs">
              <strong>{hoofdprijs}</strong>
              {aanbieder && (
                <span className="muted"> · aangeboden door {aanbieder}</span>
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <button className="btn btn-gold btn-groot" onClick={start}>
                <IconTrophy size={20} /> Start trekking
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------- Klaar: overzicht ----------
  if (fase === 'klaar') {
    const hoofd = winnaars.find((w) => w.hoofdprijs);
    return (
      <>
        <p style={{ marginTop: 20 }}>
          <Link href={`/beheer/ronde/${rondeId}`}>← Terug naar ronde</Link>
        </p>
        <h1>Uitslag — {rondeNaam}</h1>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Prijs</th>
                <th>Lot</th>
                <th>Winnaar</th>
              </tr>
            </thead>
            <tbody>
              {winnaars.map((w, i) => (
                <tr key={i}>
                  <td>
                    {w.hoofdprijs ? (
                      <strong>
                        <IconTrophy size={15} /> {w.prijs}
                      </strong>
                    ) : (
                      w.prijs
                    )}
                  </td>
                  <td>#{w.lot.lotnummer}</td>
                  <td>{w.lot.naam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hoofd && !opgeslagen && (
          <form
            className="panel"
            action={async (fd) => {
              await maakWinnaar(fd);
              setOpgeslagen(true);
            }}
          >
            <h3 style={{ marginTop: 0 }}>Hoofdprijs-winnaar in de galerij zetten</h3>
            <input type="hidden" name="ronde_id" value={rondeId} />
            <input type="hidden" name="maand" value={datum} />
            <input type="hidden" name="naam" value={hoofd.lot.naam} />
            <input type="hidden" name="experience_titel" value={hoofdprijs} />
            <input type="hidden" name="aanbieder" value={aanbieder} />
            <p className="muted" style={{ marginTop: 0 }}>
              {hoofd.lot.naam} — {hoofdprijs}
              {aanbieder ? ` (aangeboden door ${aanbieder})` : ''}. Voeg eventueel
              een foto toe.
            </p>
            <label>Foto (optioneel)</label>
            <input name="foto" type="file" accept="image/*" />
            <div style={{ marginTop: 14 }}>
              <button className="btn" type="submit">
                Publiceren in galerij
              </button>
            </div>
          </form>
        )}
        {opgeslagen && (
          <div className="notice notice-ok">Hoofdprijs-winnaar staat in de galerij.</div>
        )}

        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={opnieuw}>
            Opnieuw trekken
          </button>
        </div>
      </>
    );
  }

  // ---------- Show: fullscreen onthulling ----------
  const huidige = prijzen[index];
  return (
    <div className="trekking-overlay">
      <div className="trekking-ronde">{rondeNaam}</div>

      <div className="trekking-label">
        Prijs {index + 1} van {prijzen.length}
      </div>
      <div className={`trekking-prijs ${huidige?.hoofdprijs ? 'hoofd' : ''}`}>
        {huidige?.hoofdprijs ? (
          <>
            <IconTrophy size={26} /> {huidige.label}
          </>
        ) : (
          huidige?.label
        )}
      </div>

      <div className={`trekking-nummer ${cycling ? 'cycling' : ''} ${onthuld ? 'reveal' : ''}`}>
        {display === null ? ' ' : `#${display}`}
      </div>

      {onthuld ? (
        <div className="trekking-naam reveal">
          <IconTrophy size={40} /> {onthuld.naam}
        </div>
      ) : (
        <div className="trekking-naam placeholder">&nbsp;</div>
      )}

      <div className="trekking-actions">
        {!onthuld ? (
          <button className="btn btn-gold btn-groot" onClick={trek} disabled={cycling}>
            {cycling ? 'Trekken…' : 'Trek de winnaar'}
          </button>
        ) : (
          <button className="btn btn-groot" onClick={volgende}>
            {index + 1 >= prijzen.length ? 'Naar de uitslag →' : 'Volgende prijs →'}
          </button>
        )}
      </div>

      {onthuld && pool.length > 0 && (
        <button className="trekking-herkans" onClick={herkans}>
          Winnaar accepteert niet? Trek opnieuw voor deze prijs
        </button>
      )}

      <button className="trekking-sluit" onClick={opnieuw} aria-label="Sluiten">
        ✕
      </button>
    </div>
  );
}
