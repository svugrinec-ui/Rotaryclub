'use client';

import { useState } from 'react';

export default function LotenOpzoeken() {
  const [naam, setNaam] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [nummers, setNummers] = useState<number[] | null>(null);

  async function zoek(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    setNummers(null);
    if (!naam.trim()) {
      setFout('Vul je naam in.');
      return;
    }
    setBezig(true);
    try {
      const res = await fetch('/api/loten/opzoeken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: naam.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Zoeken mislukt.');
      setNummers(data.nummers as number[]);
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Onbekende fout.');
    } finally {
      setBezig(false);
    }
  }

  return (
    <details className="beheer-inklap">
      <summary>Je lotnummers kwijt? Zoek ze op</summary>
      <form onSubmit={zoek} style={{ marginTop: 12 }}>
        {fout && <div className="notice notice-err">{fout}</div>}
        <div className="inline-form">
          <div>
            <label htmlFor="zoek-naam">Je naam</label>
            <input
              id="zoek-naam"
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Voor- en achternaam"
              autoComplete="name"
            />
          </div>
          <button className="btn" type="submit" disabled={bezig}>
            {bezig ? 'Zoeken…' : 'Zoek'}
          </button>
        </div>
      </form>

      {nummers !== null &&
        (nummers.length > 0 ? (
          <div className="lot-badge" style={{ marginTop: 14 }}>
            <small>Je loten van deze loterij:</small>
            <div className="nummer">{nummers.join(' · ')}</div>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            Geen loten gevonden op die naam voor de loterij van nu. Let even op de
            spelling, of vraag de commissie.
          </p>
        ))}
    </details>
  );
}
