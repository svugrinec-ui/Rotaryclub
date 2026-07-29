'use client';

import { useState, useEffect } from 'react';
import { euro } from '@/lib/format';
import { BUNDELS, bundelVoorBedrag } from '@/lib/bundels';
import { IconLock } from '@/components/Icons';

interface Props {
  rondeId: string;
}

interface Toegekend {
  nummers: number[];
  naam: string;
  bedrag: number;
}

const STAP_ICONEN: Record<number, React.ReactNode> = {
  1: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  2: (
    <>
      <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </>
  ),
  3: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
};
const STAP_LABELS: Record<number, string> = {
  1: 'Naam & bundel',
  2: 'Je loten',
  3: 'Betalen',
};

function Stappen({ actief }: { actief: 1 | 2 | 3 }) {
  return (
    <ol className="stappen">
      {[1, 2, 3].map((n) => (
        <li key={n} className={actief === n ? 'actief' : ''}>
          <span className="stap-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {STAP_ICONEN[n]}
            </svg>
          </span>
          <span>
            <span className="stap-num">{n}.</span> {STAP_LABELS[n]}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function MeedoenForm({ rondeId }: Props) {
  const [naam, setNaam] = useState('');
  const [bedrag, setBedrag] = useState<number>(BUNDELS[0]?.bedrag ?? 5);
  const [betaalwijze, setBetaalwijze] = useState<'bank' | 'cash'>('bank');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<Toegekend | null>(null);
  // Zachte duplicaat-check: al bestaande loten op deze naam in deze ronde.
  const [bekend, setBekend] = useState<number[] | null>(null);
  const [getoond, setGetoond] = useState(false);
  // Eigen lotnummers kiezen.
  const [eigenModus, setEigenModus] = useState(false);
  const [eigenNummers, setEigenNummers] = useState<string[]>([]);
  const [pending, setPending] = useState<number[] | null>(null); // keuze onthouden voor "toch bijkopen"
  const [bezet, setBezet] = useState<Set<number>>(new Set()); // al vergeven nummers in de ronde

  const huidigeBundel = bundelVoorBedrag(bedrag);
  const aantalNummers = huidigeBundel?.loten ?? 0;
  // Staat er minstens één ingevuld nummer dat al vergeven is?
  const heeftBezetNummer = Array.from({ length: aantalNummers }, (_, i) =>
    (eigenNummers[i] ?? '').trim(),
  ).some((v) => v !== '' && bezet.has(Number(v)));

  // Bij het openen van "eigen nummers" de al vergeven nummers ophalen.
  useEffect(() => {
    if (!eigenModus) return;
    let actief = true;
    fetch(`/api/loten/bezet?ronde_id=${encodeURIComponent(rondeId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (actief && Array.isArray(d.nummers)) setBezet(new Set(d.nummers as number[]));
      })
      .catch(() => {});
    return () => {
      actief = false;
    };
  }, [eigenModus, rondeId]);

  // De echte inschrijving (loten aanmaken). nummers = null → willekeurig.
  async function maakLoten(nummers: number[] | null) {
    const res = await fetch('/api/loten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ronde_id: rondeId,
        naam: naam.trim(),
        contact: null,
        bedrag,
        ...(nummers ? { nummers } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Er ging iets mis.');
    setBekend(null);
    setBetaalwijze('bank'); // standaard bank; keuze valt nu op het betaalscherm
    setResultaat({ nummers: data.nummers, naam: naam.trim(), bedrag: data.bedrag });
  }

  // Valideert de zelf ingevulde nummers; geeft ze terug of null (met foutmelding).
  function leesEigenNummers(): number[] | null {
    const vals = Array.from({ length: aantalNummers }, (_, i) => (eigenNummers[i] ?? '').trim());
    if (vals.some((v) => v === '')) {
      setFout(`Vul alle ${aantalNummers} lotnummers in.`);
      return null;
    }
    const nums = vals.map((v) => Number(v));
    if (nums.some((n) => !Number.isInteger(n) || n < 1 || n > 9999)) {
      setFout('Lotnummers moeten hele getallen tussen 1 en 9999 zijn.');
      return null;
    }
    if (new Set(nums).size !== nums.length) {
      setFout('Je hebt een dubbel lotnummer gekozen.');
      return null;
    }
    return nums;
  }

  // Gedeelde inschrijf-poging: naam-check → duplicaat-check → aanmaken.
  async function probeer(nummers: number[] | null) {
    setFout(null);
    if (!naam.trim()) {
      setFout('Vul je naam in.');
      return;
    }
    setBezig(true);
    try {
      const check = await fetch('/api/loten/opzoeken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: naam.trim() }),
      });
      const cd = await check.json().catch(() => ({}));
      if (check.ok && Array.isArray(cd.nummers) && cd.nummers.length > 0) {
        setPending(nummers); // onthoud de keuze voor "toch bijkopen"
        setBekend(cd.nummers as number[]);
        return; // waarschuwing tonen; nog niks aanmaken
      }
      await maakLoten(nummers);
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Onbekende fout.');
    } finally {
      setBezig(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    probeer(null); // willekeurige nummers
  }

  function bevestigEigen() {
    const nums = leesEigenNummers();
    if (nums) probeer(nums);
  }

  // "Toch een extra bundel bijkopen" — na de waarschuwing alsnog aanmaken.
  async function tochBijkopen() {
    setFout(null);
    setBezig(true);
    try {
      await maakLoten(pending);
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Onbekende fout.');
    } finally {
      setBezig(false);
    }
  }

  // Betaalwijze kiezen op het betaalscherm (stap 3) → meteen wegschrijven.
  function kiesBetaalwijze(wijze: 'bank' | 'cash') {
    setBetaalwijze(wijze);
    if (!resultaat) return;
    fetch('/api/loten/betaalwijze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ronde_id: rondeId,
        naam: resultaat.naam,
        nummers: resultaat.nummers,
        betaalwijze: wijze,
      }),
    }).catch(() => {});
  }

  function opnieuw() {
    setResultaat(null);
    setBekend(null);
    setGetoond(false);
    setNaam('');
    setBedrag(BUNDELS[0]?.bedrag ?? 5);
    setBetaalwijze('bank');
    setEigenModus(false);
    setEigenNummers([]);
    setPending(null);
  }

  // ---------- Resultaat: eerst de loten, dan betalen ----------
  if (resultaat) {
    const bundel = bundelVoorBedrag(resultaat.bedrag);
    return (
      <>
        <Stappen actief={2} />

        <div className="lot-badge">
          <small>
            Gelukt, {resultaat.naam}! Je {resultaat.nummers.length} lot
            {resultaat.nummers.length > 1 ? 'nummers' : 'nummer'}:
          </small>
          <div className="nummer">{resultaat.nummers.join(' · ')}</div>
          <small>Je doet mee met de trekking — bij het trekken roepen we ook de naam om.</small>
        </div>

        <div className="panel" style={{ textAlign: 'center', marginTop: 28 }}>
          <div className="betaal-eyebrow">Stap 3 · Betalen</div>
          <h3 style={{ marginTop: 4 }}>Betalen: {euro(resultaat.bedrag)}</h3>

          <div className="betaalwijze-grid" style={{ marginTop: 12, textAlign: 'left' }}>
            <button
              type="button"
              className={`betaalwijze-kaart ${betaalwijze === 'bank' ? 'gekozen' : ''}`}
              onClick={() => kiesBetaalwijze('bank')}
              aria-pressed={betaalwijze === 'bank'}
            >
              <span className="betaalwijze-titel">Via bank</span>
              <span className="betaalwijze-sub">iDEAL / betaalverzoek</span>
            </button>
            <button
              type="button"
              className={`betaalwijze-kaart ${betaalwijze === 'cash' ? 'gekozen' : ''}`}
              onClick={() => kiesBetaalwijze('cash')}
              aria-pressed={betaalwijze === 'cash'}
            >
              <span className="betaalwijze-titel">Contant</span>
              <span className="betaalwijze-sub">cash aan de commissie</span>
            </button>
          </div>

          {betaalwijze === 'cash' ? (
            <div className="notice notice-info" style={{ marginTop: 14 }}>
              Geef <strong>{euro(resultaat.bedrag)}</strong> contant aan de
              loterijcommissie. Je loten doen al mee — de commissie vinkt je
              betaling straks af.
            </div>
          ) : (
            <>
              {bundel?.zelfBedrag && (
                <div className="notice notice-info" style={{ marginTop: 14 }}>
                  Bij deze betaling vul je zélf het bedrag in — vul{' '}
                  <strong>{euro(resultaat.bedrag)}</strong> in je bank-app in.
                </div>
              )}

              {bundel?.betaalLink ? (
                <a
                  className="betaal-cta"
                  href={bundel.betaalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: 14 }}
                >
                  <span className="betaal-cta-main">
                    <IconLock size={18} />
                    Betaal {euro(resultaat.bedrag)} via je bank
                    <span className="betaal-cta-arrow" aria-hidden>→</span>
                  </span>
                  <span className="betaal-cta-sub">
                    Opent in een nieuw tabblad — iDEAL / je bank-app
                  </span>
                </a>
              ) : (
                <div className="notice notice-info" style={{ marginTop: 14 }}>
                  Betaal {euro(resultaat.bedrag)} via de bekende QR-code of vraag de
                  commissie.
                </div>
              )}

              <div className="betaal-veilig">
                <IconLock size={13} /> Veilig betalen via Rabobank-betaalverzoek
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="btn btn-gold" onClick={opnieuw}>
            Nog iemand inschrijven
          </button>
        </div>
      </>
    );
  }

  // ---------- Al bekende loten: bevestiging "dit ben ik" ----------
  if (bekend && getoond) {
    return (
      <>
        <Stappen actief={2} />
        <div className="lot-badge">
          <small>
            Je doet al mee, {naam.trim()}! Je {bekend.length} lot
            {bekend.length > 1 ? 'nummers' : 'nummer'}:
          </small>
          <div className="nummer">{bekend.join(' · ')}</div>
          <small>Je doet mee met de trekking — bij het trekken roepen we ook de naam om.</small>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="btn btn-gold" onClick={opnieuw}>
            Nog iemand inschrijven
          </button>
        </div>
      </>
    );
  }

  // ---------- Zachte waarschuwing: deze naam heeft al loten ----------
  if (bekend) {
    return (
      <>
        <Stappen actief={1} />
        <div className="panel">
          <div className="notice notice-info">
            <strong>Het lijkt erop dat je al meedoet.</strong> Op de naam “
            {naam.trim()}” staan al {bekend.length} loten voor deze ronde:
            <div className="nummer" style={{ marginTop: 8 }}>{bekend.join(' · ')}</div>
          </div>
          <p className="muted">
            Heb je je per ongeluk nog een keer ingeschreven? Dan hoef je niks te
            doen — je doet al mee. Wil je tóch extra loten bijkopen, dan kan dat.
          </p>
          <div className="row-actions">
            <button className="btn" type="button" onClick={() => setGetoond(true)}>
              Dit zijn mijn loten
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={tochBijkopen}
              disabled={bezig}
            >
              {bezig ? 'Bezig…' : 'Toch een extra bundel bijkopen'}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---------- Formulier: naam + bundel ----------
  return (
    <>
      <Stappen actief={1} />

      <form className="panel" onSubmit={submit}>
        {fout && <div className="notice notice-err">{fout}</div>}

      <label htmlFor="naam">Je naam</label>
      <input
        id="naam"
        type="text"
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        placeholder="Voor- en achternaam"
        autoComplete="name"
        required
      />

      <label>Kies je bundel</label>
      <div className="bundel-grid">
        {BUNDELS.map((b) => (
          <button
            type="button"
            key={b.bedrag}
            className={`bundel-kaart ${bedrag === b.bedrag ? 'gekozen' : ''}`}
            onClick={() => setBedrag(b.bedrag)}
            aria-pressed={bedrag === b.bedrag}
          >
            <span className="bundel-bedrag">{euro(b.bedrag)}</span>
            <span className="bundel-loten">{b.loten} loten</span>
          </button>
        ))}
      </div>

        {eigenModus && (
          <div className="eigen-nummers">
            <label>Kies je {aantalNummers} lotnummers (1–9999)</label>
            <div className="eigen-nummers-grid">
              {Array.from({ length: aantalNummers }, (_, i) => {
                const v = (eigenNummers[i] ?? '').trim();
                const isBezet = v !== '' && bezet.has(Number(v));
                return (
                  <input
                    key={i}
                    type="number"
                    min={1}
                    max={9999}
                    inputMode="numeric"
                    placeholder="#"
                    className={isBezet ? 'nummer-bezet' : ''}
                    title={isBezet ? 'Dit nummer is al vergeven — kies een ander' : undefined}
                    value={eigenNummers[i] ?? ''}
                    onChange={(e) => {
                      const kopie = [...eigenNummers];
                      kopie[i] = e.target.value;
                      setEigenNummers(kopie);
                    }}
                  />
                );
              })}
            </div>
            {heeftBezetNummer && (
              <p className="muted" style={{ marginBottom: 0 }}>
                Nummers met een{' '}
                <span style={{ color: '#d64545', fontWeight: 700 }}>rood randje</span> zijn
                al vergeven — kies dan een ander.
              </p>
            )}
          </div>
        )}

        <div className="meedoen-knoppen" style={{ marginTop: 18 }}>
          {eigenModus ? (
            <>
              <button
                className="btn btn-groot btn-vol"
                type="button"
                onClick={bevestigEigen}
                disabled={bezig}
              >
                {bezig ? 'Bezig…' : 'Bevestig mijn nummers →'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setEigenModus(false)}
                disabled={bezig}
              >
                Toch willekeurige nummers
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-groot btn-vol" type="submit" disabled={bezig}>
                {bezig ? 'Bezig…' : 'Naar mijn loten →'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setEigenModus(true)}
                disabled={bezig}
              >
                Kies eigen lotnummers
              </button>
            </>
          )}
        </div>
      </form>
    </>
  );
}
