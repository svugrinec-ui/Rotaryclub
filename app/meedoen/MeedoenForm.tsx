'use client';

import { useState } from 'react';
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
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<Toegekend | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    if (!naam.trim()) {
      setFout('Vul je naam in.');
      return;
    }
    setBezig(true);
    try {
      const res = await fetch('/api/loten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ronde_id: rondeId,
          naam: naam.trim(),
          contact: null,
          bedrag,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Er ging iets mis.');
      setResultaat({ nummers: data.nummers, naam: naam.trim(), bedrag: data.bedrag });
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Onbekende fout.');
    } finally {
      setBezig(false);
    }
  }

  function opnieuw() {
    setResultaat(null);
    setNaam('');
    setBedrag(BUNDELS[0]?.bedrag ?? 5);
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
          <h3 style={{ marginTop: 4 }}>Nu betalen: {euro(resultaat.bedrag)}</h3>

          {bundel?.zelfBedrag && (
            <div className="notice notice-info">
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
            <div className="notice notice-info">
              Betaal {euro(resultaat.bedrag)} via de bekende QR-code of vraag de
              commissie.
            </div>
          )}

          <div className="betaal-veilig">
            <IconLock size={13} /> Veilig betalen via Rabobank-betaalverzoek
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="btn btn-gold" onClick={opnieuw}>
            Nog iemand inschrijven
          </button>
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

        <div style={{ marginTop: 18 }}>
          <button className="btn btn-groot btn-vol" type="submit" disabled={bezig}>
            {bezig ? 'Bezig…' : 'Naar mijn loten →'}
          </button>
        </div>
      </form>
    </>
  );
}
