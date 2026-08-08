'use client';

import Link from 'next/link';
import { useMijnLoten, useTrekkingLive } from '@/lib/useTrekkingLive';
import TrekkingLiveView, { ZoekMijnLoten } from '@/components/TrekkingLiveView';
import MijnLotenRij, { lotenTitel } from '@/components/MijnLotenRij';
import type { TrekkingLive } from '@/lib/types';

interface Props {
  start: TrekkingLive | null;
  startRondeNaam: string | null;
}

/**
 * De losse live-pagina. Handig als deelbare link of achter een QR-code; op de
 * gewone pagina's komt de trekking vanzelf in beeld via TrekkingLiveOverlay.
 */
export default function TrekkingLivePagina({ start, startRondeNaam }: Props) {
  const { stand, rondeNaam, rol, actief } = useTrekkingLive(start, startRondeNaam);
  const [mijn, setMijn] = useMijnLoten(stand?.ronde_id);

  if (!actief || !stand) {
    return (
      <div className="live-wacht">
        <div className="live-badge">Live</div>
        <h1>Nog geen trekking bezig</h1>
        <p className="muted">
          Zodra de commissie begint met trekken, verschijnt het hier
          automatisch — je hoeft deze pagina niet te verversen. Het komt ook in
          beeld op de andere pagina&apos;s van de app.
        </p>
        {(mijn?.nummers.length ?? 0) > 0 ? (
          <MijnLotenRij
            nummers={mijn!.nummers}
            titel={lotenTitel(mijn!.nummers.length, mijn!.naam)}
          />
        ) : (
          <ZoekMijnLoten rondeId={stand?.ronde_id} onGevonden={setMijn} />
        )}
        <p style={{ marginTop: 20 }}>
          <Link href="/meedoen">← Naar meedoen</Link>
        </p>
      </div>
    );
  }

  return (
    <TrekkingLiveView
      stand={stand}
      rondeNaam={rondeNaam}
      rol={rol}
      mijn={mijn}
      setMijn={setMijn}
    />
  );
}
