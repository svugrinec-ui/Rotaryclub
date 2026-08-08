'use client';

import { useState } from 'react';
import { IconTrophy } from '@/components/Icons';
import Confetti from '@/components/Confetti';
import MijnLotenRij, { lotenTitel } from '@/components/MijnLotenRij';
import Stappen from '@/components/Stappen';
import CijferNummer from '@/components/CijferNummer';
import { kanNogWinnen, useCijferOnthulling } from '@/lib/cijferReveal';
import { bewaarMijnLoten, type MijnLoten } from '@/lib/mijnLoten';
import type { TrekkingLive } from '@/lib/types';

interface Props {
  stand: TrekkingLive;
  rondeNaam: string | null;
  /** Cijfer dat voorbijrolt tijdens het trekken. */
  rol: number | null;
  mijn: MijnLoten | null;
  setMijn: (m: MijnLoten | null) => void;
}

/**
 * Het live-scherm van de trekking: de prijs, het getrokken lot en de eigen
 * lotnummers van deze bezoeker. Wordt zowel in het overlay (op elke pagina)
 * als op /live gebruikt.
 */
export default function TrekkingLiveView({
  stand,
  rondeNaam,
  rol,
  mijn,
  setMijn,
}: Props) {
  const mijnNummers = mijn?.nummers ?? [];
  const onthullen = stand.fase === 'onthuld';
  const winnaar = onthullen ? stand.winnaar_lotnummer : null;

  // Cijfer voor cijfer: elk toestel bouwt het nummer zelf op vanaf het moment
  // dat de commissie het doorgeeft.
  const zichtbaar = useCijferOnthulling(
    winnaar,
    stand.prijs_index,
    onthullen,
    stand.bijgewerkt_op,
  );
  const cijfers = winnaar === null ? 0 : String(winnaar).length;
  const compleet = onthullen && zichtbaar >= cijfers && cijfers > 0;

  // Welke van jouw loten kan het nog zijn? De rest dimt weg.
  const mogelijk = onthullen
    ? mijnNummers.filter((n) => kanNogWinnen(n, winnaar, zichtbaar))
    : null;
  const gewonnenNummer = compleet ? winnaar : null;
  const ikWin = compleet && winnaar !== null && mijnNummers.includes(winnaar);

  return (
    <div
      className={`live-show${ikWin ? ' ik-win' : ''}${
        stand.fase === 'wachten' ? ' wachtstand' : ''
      }`}
    >
      {ikWin && <Confetti />}

      <div className="live-kop">
        <span className="live-badge">Live</span>
        {rondeNaam && <span className="live-ronde">{rondeNaam}</span>}
      </div>

      {/* Dezelfde stappenbalk als bij het inschrijven: je bent een stap
          verder in dezelfde route, niet op een vervangen pagina. */}
      <Stappen actief={4} donker />


      {stand.prijs_totaal > 0 && (
        <div className="live-prijsnr">
          Prijs {stand.prijs_index + 1} van {stand.prijs_totaal}
        </div>
      )}
      <div className={`live-prijs${stand.hoofdprijs ? ' hoofd' : ''}`}>
        {stand.hoofdprijs && <IconTrophy size={22} />} {stand.prijs_label}
      </div>

      <div
        className={`live-nummer cijferrij${stand.fase === 'rollen' ? ' rollen' : ''}${
          compleet ? ' onthuld' : ''
        }${stand.fase === 'wachten' ? ' wacht' : ''}`}
      >
        {stand.fase === 'rollen' ? (
          <>#{rol ?? '••••'}</>
        ) : (
          <CijferNummer nummer={winnaar} zichtbaar={zichtbaar} />
        )}
      </div>

      {stand.fase === 'wachten' && (
        <div className="live-status">
          De trekking begint — <strong>jouw loten doen mee</strong>. Blijf kijken.
        </div>
      )}
      {stand.fase === 'rollen' && <div className="live-status">De trommel draait…</div>}

      {onthullen && !compleet && (
        <div className="live-status">
          Nog {cijfers - zichtbaar} cijfer{cijfers - zichtbaar === 1 ? '' : 's'}…
        </div>
      )}

      {compleet && (
        <>
          <div className="live-winnaar">{stand.winnaar_naam}</div>
          {ikWin ? (
            <div className="live-jij">
              <IconTrophy size={26} /> Dat is jouw lot — gefeliciteerd!
            </div>
          ) : (
            mijnNummers.length > 0 && (
              <div className="live-status zacht">
                Niet jouw nummer deze keer.
                {stand.prijs_index + 1 < stand.prijs_totaal && ' Er komen nog prijzen!'}
              </div>
            )
          )}
        </>
      )}

      {mijnNummers.length > 0 ? (
        <div className="live-mijn">
          <MijnLotenRij
            nummers={mijnNummers}
            titel={lotenTitel(mijnNummers.length, mijn?.naam)}
            gewonnen={gewonnenNummer}
            mogelijk={mogelijk}
            donker
          />
          {onthullen && !compleet && mogelijk && (
            <div className="live-kans">
              {mogelijk.length === 0 ? (
                'Deze prijs gaat naar iemand anders.'
              ) : (
                <>
                  <strong>{mogelijk.length}</strong> van jouw loten kan het nog zijn
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <ZoekMijnLoten rondeId={stand.ronde_id} onGevonden={setMijn} />
      )}
    </div>
  );
}


/** Voor wie zijn loten (nog) niet op dit toestel heeft staan. */
export function ZoekMijnLoten({
  rondeId,
  onGevonden,
}: {
  rondeId?: string;
  onGevonden: (m: MijnLoten) => void;
}) {
  const [naam, setNaam] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function zoek(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    if (!naam.trim()) {
      setFout('Vul je naam in.');
      return;
    }
    setBezig(true);
    try {
      const res = await fetch('/api/loten/opzoeken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: naam.trim(), ronde_id: rondeId ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Zoeken mislukt.');
      const nummers = (data.nummers as number[]) ?? [];
      if (nummers.length === 0) {
        setFout('Geen loten gevonden op die naam. Let even op de spelling.');
        return;
      }
      const id = (data.ronde_id as string) ?? rondeId ?? '';
      if (id) bewaarMijnLoten(id, naam.trim(), nummers);
      onGevonden({ ronde_id: id, naam: naam.trim(), nummers });
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Onbekende fout.');
    } finally {
      setBezig(false);
    }
  }

  return (
    <form className="live-zoek" onSubmit={zoek}>
      <div className="live-mijn-kop">Zet je eigen loten in beeld</div>
      {fout && <div className="notice notice-err">{fout}</div>}
      <div className="inline-form">
        <div>
          <label htmlFor="live-naam">Je naam</label>
          <input
            id="live-naam"
            type="text"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Voor- en achternaam"
            autoComplete="name"
          />
        </div>
        <button className="btn" type="submit" disabled={bezig}>
          {bezig ? 'Zoeken…' : 'Toon mijn loten'}
        </button>
      </div>
    </form>
  );
}
