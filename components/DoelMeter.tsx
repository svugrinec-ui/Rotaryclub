import { euro } from '@/lib/format';
import type { Voortgang } from '@/lib/doel';
import { IconHeart, IconTrophy } from '@/components/Icons';

interface Props {
  voortgang: Voortgang;
  titel?: string;
  doelNaam?: string; // naam van het goede doel waarvoor gegeven wordt
  doelLabel?: string; // begeleidende tekst vóór de doelnaam (per pagina logisch)
  motiverend?: boolean; // net iets aansporender op de meedoen-pagina
}

function niveau(pct: number): string {
  if (pct >= 100) return 'af';
  if (pct >= 66) return 'bijna';
  if (pct >= 33) return 'onderweg';
  return 'start';
}

export default function DoelMeter({
  voortgang,
  titel,
  doelNaam,
  doelLabel = 'Je geeft voor',
  motiverend,
}: Props) {
  const { opgehaald, doel, resterend, pct, maandNaam, gehaald } = voortgang;
  const extra = opgehaald - doel;
  const over = extra > 0; // voorbij het doel

  // Bij een overshoot staat de balk voor het totaal: groen tot het doel, goud
  // voor het extra bedrag. goalFrac = waar het doel in dat totaal ligt.
  const goalFrac = over && opgehaald > 0
    ? Math.min(92, Math.max(8, (doel / opgehaald) * 100))
    : 100;

  const fillStyle = over
    ? {
        width: '100%',
        background: `linear-gradient(90deg, #1f9d55 0 ${goalFrac}%, #f4a416 ${goalFrac}% 100%)`,
        animation: 'none' as const,
      }
    : { width: `${Math.min(100, Math.max(2, pct))}%` };

  return (
    <div className={`doelmeter niveau-${niveau(pct)}`}>
      <div className="doelmeter-top">
        <span className="doelmeter-titel">{titel ?? `Doel voor ${maandNaam}`}</span>
        <span className="doelmeter-cijfers">
          {euro(opgehaald)} <span className="muted">/ {euro(doel)}</span>
        </span>
      </div>

      {doelNaam && (
        <div className="doelmeter-doel">
          <IconHeart size={16} /> {doelLabel}: <strong>{doelNaam}</strong>
        </div>
      )}

      <div className="doelmeter-track">
        <div className="doelmeter-fill" style={fillStyle}>
          {over && <span className="doelmeter-glans" style={{ left: `${goalFrac}%` }} />}
        </div>
        {!over && voortgang.weken > 1 && (
          <div className="doelmeter-ticks" aria-hidden>
            {Array.from({ length: voortgang.weken - 1 }, (_, i) => (
              <span
                key={i}
                style={{ left: `${((i + 1) / voortgang.weken) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {over ? (
        <div className="doelmeter-hint">
          <span className="doelmeter-legenda groen" /> tot het doel ({euro(doel)}) ·{' '}
          <span className="doelmeter-legenda goud" /> de {euro(extra)} die we erbovenop haalden
        </div>
      ) : voortgang.weken > 1 ? (
        <div className="doelmeter-hint">
          De stippellijnen zijn de {voortgang.weken} weken van de maand — samen halen
          we het maanddoel binnen de maand.
        </div>
      ) : null}

      <div className="doelmeter-status">
        {over ? (
          <strong>
            <IconTrophy size={16} /> Voorbij het doel! {euro(extra)} extra —{' '}
            {Math.round(pct)}% opgehaald
          </strong>
        ) : gehaald ? (
          <strong>
            <IconTrophy size={16} /> Doel gehaald! Precies raak!
          </strong>
        ) : motiverend ? (
          <span>
            Nog <strong>{euro(resterend)}</strong> te gaan deze maand — doe mee en help
            het doel halen!
          </span>
        ) : (
          <span>
            Nog <strong>{euro(resterend)}</strong> te gaan · {Math.round(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}
