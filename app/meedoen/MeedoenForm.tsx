'use client';

import { useState } from 'react';
import { euro } from '@/lib/format';
import { BUNDELS, BETAAL_QR_ALGEMEEN, bundelVoorBedrag } from '@/lib/bundels';

interface Props {
  rondeId: string;
}

interface Toegekend {
  nummers: number[];
  naam: string;
  bedrag: number;
}

type Stap = 'gegevens' | 'betalen' | 'klaar';

export default function MeedoenForm({ rondeId }: Props) {
  const [stap, setStap] = useState<Stap>('gegevens');
  const [naam, setNaam] = useState('');
  const [bedrag, setBedrag] = useState<number>(BUNDELS[0]?.bedrag ?? 5);
  const [betaald, setBetaald] = useState(false);
  const [imgFout, setImgFout] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<Toegekend | null>(null);

  const bundel = bundelVoorBedrag(bedrag);
  const qrSrc = bundel?.qr ?? BETAAL_QR_ALGEMEEN;

  function naarBetalen(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    if (!naam.trim()) {
      setFout('Vul je naam in.');
      return;
    }
    setBetaald(false);
    setImgFout(false);
    setStap('betalen');
  }

  async function toonLoten() {
    setFout(null);
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
      setStap('klaar');
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
    setBetaald(false);
    setImgFout(false);
    setStap('gegevens');
  }

  // ---------- Stap 3: loten getoond ----------
  if (stap === 'klaar' && resultaat) {
    return (
      <div className="lot-badge">
        <small>
          Gelukt, {resultaat.naam}! Je {resultaat.nummers.length} lot
          {resultaat.nummers.length > 1 ? 'nummers' : 'nummer'}:
        </small>
        <div className="nummer">{resultaat.nummers.join(' · ')}</div>
        <small>
          Bedankt voor je bijdrage van {euro(resultaat.bedrag)}! Je doet nu
          meteen mee met de trekking. Succes! 🍀
        </small>
        <div style={{ marginTop: 18 }}>
          <button className="btn btn-gold" onClick={opnieuw}>
            Nog iemand inschrijven
          </button>
        </div>
      </div>
    );
  }

  // ---------- Stap 2: betalen ----------
  if (stap === 'betalen') {
    return (
      <div className="panel">
        {fout && <div className="notice notice-err">{fout}</div>}

        <h3 style={{ marginTop: 0 }}>
          Betaal {euro(bedrag)} — {bundel?.loten} loten
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Tik op de knop om veilig te betalen via je eigen bank. Vink daarna aan dat
          het gelukt is — dan zie je je lotnummers.
        </p>

        {bundel?.zelfBedrag && (
          <div className="notice notice-info">
            Bij deze betaling vul je zélf het bedrag in — vul{' '}
            <strong>{euro(bedrag)}</strong> in je bank-app in.
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
              <span className="betaal-cta-lock" aria-hidden>🔒</span>
              Betaal {euro(bedrag)} via je bank
              <span className="betaal-cta-arrow" aria-hidden>→</span>
            </span>
            <span className="betaal-cta-sub">
              Opent iDEAL / je bank-app in een nieuw tabblad
            </span>
          </a>
        ) : (
          <div className="notice notice-info">
            Betaallink is nog niet ingesteld. Betaal {euro(bedrag)} via de bekende
            QR-code of vraag de commissie.
          </div>
        )}

        <div className="betaal-veilig">
          <span aria-hidden>🔒</span> Veilig betalen via Rabobank-betaalverzoek
        </div>

        {qrSrc && !imgFout && (
          <details className="betaal-scan">
            <summary>Op een computer? Scan met je telefoon</summary>
            <div className="betaal-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`Betaal-QR voor ${euro(bedrag)}`}
                onError={() => setImgFout(true)}
              />
            </div>
          </details>
        )}

        <label className="betaal-check">
          <input
            type="checkbox"
            checked={betaald}
            onChange={(e) => setBetaald(e.target.checked)}
          />
          <span>
            Ik heb <strong>{euro(bedrag)}</strong> betaald
          </span>
        </label>

        <div className="row-actions" style={{ marginTop: 16 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setStap('gegevens')}
            disabled={bezig}
          >
            ← Terug
          </button>
          <button className="btn" onClick={toonLoten} disabled={!betaald || bezig}>
            {bezig ? 'Bezig…' : 'Toon mijn loten'}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Stap 1: gegevens + bundel ----------
  return (
    <form className="panel" onSubmit={naarBetalen}>
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
        <button className="btn" type="submit">
          Naar betalen →
        </button>
      </div>
    </form>
  );
}
