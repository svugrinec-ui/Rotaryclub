'use client';

import { usePathname } from 'next/navigation';
import { useMijnLoten, useTrekkingLive } from '@/lib/useTrekkingLive';
import TrekkingLiveView from '@/components/TrekkingLiveView';

/**
 * Zodra de commissie begint te trekken, neemt de trekking het scherm over —
 * waar de bezoeker ook zit. Bewust niet weg te klikken: tijdens de trekking
 * kunnen er geen loten meer bij, dus er is niets anders te doen. Zodra de
 * uitslag er is, staat de app weer open.
 *
 * Uit op /beheer (daar draait de echte show), op /live en op /meedoen (daar
 * zit de trekking al integraal in de pagina).
 */
export default function TrekkingLiveOverlay() {
  const pad = usePathname() ?? '';
  const stil =
    pad.startsWith('/beheer') || pad.startsWith('/live') || pad.startsWith('/meedoen');

  const { stand, rondeNaam, rol, actief } = useTrekkingLive(null, null, !stil);
  const [mijn, setMijn] = useMijnLoten(stand?.ronde_id);

  if (stil || !actief || !stand) return null;

  return (
    <div className="live-overlay" role="dialog" aria-label="Live trekking">
      <TrekkingLiveView
        stand={stand}
        rondeNaam={rondeNaam}
        rol={rol}
        mijn={mijn}
        setMijn={setMijn}
      />
    </div>
  );
}
