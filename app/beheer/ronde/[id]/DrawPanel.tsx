'use client';

import { useState } from 'react';
import { maakWinnaar } from '@/lib/actions';
import { IconTrophy } from '@/components/Icons';

interface Props {
  rondeId: string;
  datum: string; // standaard-datum voor de trekking (meestal vandaag)
  experiences: string[];
}

interface Getrokken {
  lotnummer: number;
  naam: string;
  aantal_betaald: number;
}

export default function DrawPanel({ rondeId, datum, experiences }: Props) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [winnaar, setWinnaar] = useState<Getrokken | null>(null);
  const [opgeslagen, setOpgeslagen] = useState(false);

  async function trek() {
    setFout(null);
    setBezig(true);
    try {
      const res = await fetch('/api/admin/trek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ronde_id: rondeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Trekken mislukt.');
      setWinnaar(data);
      setOpgeslagen(false);
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Onbekende fout.');
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="panel">
      {fout && <div className="notice notice-err">{fout}</div>}

      {!winnaar && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Trek een willekeurige winnaar uit alle <strong>betaalde</strong> loten.
          </p>
          <button className="btn btn-gold" onClick={trek} disabled={bezig}>
            {bezig ? 'Bezig…' : <><IconTrophy size={17} /> Trek winnaar</>}
          </button>
        </>
      )}

      {winnaar && (
        <>
          <div className="winner-reveal">
            <div>Winnend lot</div>
            <div className="lot">#{winnaar.lotnummer}</div>
            <div className="naam">{winnaar.naam}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              uit {winnaar.aantal_betaald} betaalde loten
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12 }}
            onClick={trek}
            disabled={bezig}
          >
            Opnieuw trekken
          </button>

          {opgeslagen ? (
            <div className="notice notice-ok" style={{ marginTop: 16 }}>
              Winnaar opgeslagen en gepubliceerd in de galerij.
            </div>
          ) : (
            <form
              className="panel"
              style={{ marginTop: 16 }}
              action={async (fd) => {
                await maakWinnaar(fd);
                setOpgeslagen(true);
              }}
            >
              <h3 style={{ marginTop: 0 }}>Winnaar vastleggen in de galerij</h3>
              <input type="hidden" name="ronde_id" value={rondeId} />
              <label>Naam winnaar</label>
              <input name="naam" type="text" defaultValue={winnaar.naam} required />
              <div className="inline-form">
                <div>
                  <label>Datum trekking</label>
                  <input name="maand" type="date" defaultValue={datum} required />
                </div>
                <div>
                  <label>Opbrengst deze week (€)</label>
                  <input name="opbrengst" type="number" step="0.01" min="0" defaultValue={0} />
                </div>
              </div>
              <label>Experience</label>
              {experiences.length > 0 ? (
                <select name="experience_titel" defaultValue={experiences[0]} required>
                  {experiences.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <input name="experience_titel" type="text" required />
              )}
              <label>Toelichting (optioneel)</label>
              <textarea name="toelichting" placeholder="Kort verhaaltje bij de foto" />
              <label>Foto (optioneel)</label>
              <input name="foto" type="file" accept="image/*" />
              <div style={{ marginTop: 16 }}>
                <button className="btn" type="submit">
                  Publiceren in galerij
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
