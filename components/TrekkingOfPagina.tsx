'use client';

import { useMijnLoten, useTrekkingLive } from '@/lib/useTrekkingLive';
import TrekkingLiveView from '@/components/TrekkingLiveView';

/**
 * Op de meedoen-pagina is de trekking niet een venster erover, maar de pagina
 * zélf: zodra de commissie begint te trekken vervangt de trekking het
 * inschrijfformulier. Zo kan er tijdens de trekking niemand meer loten kopen
 * en hoeft niemand ergens op te klikken. Daarna komt het formulier terug.
 */
export default function TrekkingOfPagina({
  children,
}: {
  children: React.ReactNode;
}) {
  const { stand, rondeNaam, rol, actief } = useTrekkingLive();
  const [mijn, setMijn] = useMijnLoten(stand?.ronde_id);

  if (actief && stand) {
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

  return <>{children}</>;
}
