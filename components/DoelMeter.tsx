import { euro } from '@/lib/format';
import type { Voortgang } from '@/lib/doel';

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
          ❤️ {doelLabel}: <strong>{doelNaam}</strong>
        </div>
      )}

      <div className="doelmeter-track">
        <div
          className="doelmeter-fill"
          style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
        />
        {voortgang.weken > 1 && (
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

      {voortgang.weken > 1 && (
        <div className="doelmeter-hint">
          De stippellijnen zijn de {voortgang.weken} weken van de maand — samen halen
          we het maanddoel binnen de maand.
        </div>
      )}

      <div className="doelmeter-status">
        {gehaald ? (
          <strong>
            🎉 Doel gehaald!{extra > 0 ? ` €${extra.toFixed(0)} erboven op — top!` : ' Precies raak!'}
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
