'use client';

import { useRef, useState } from 'react';

const MAX_ZIJDE = 1600; // px — ruim genoeg voor de galerij en het printwerk
const KWALITEIT = 0.82;
const KLEIN_GENOEG = 600 * 1024; // onder deze grootte laten we het bestand met rust

/**
 * Verkleint een foto in de browser tot een JPEG van hooguit MAX_ZIJDE.
 * Lukt dat niet (bijv. HEIC dat de browser niet kan decoderen), dan gaat het
 * originele bestand mee.
 */
async function verklein(bestand: File): Promise<File> {
  if (!bestand.type.startsWith('image/')) return bestand;
  try {
    const bitmap = await createImageBitmap(bestand, {
      imageOrientation: 'from-image', // respecteer de EXIF-draaiing van de telefoon
    });
    const schaal = Math.min(1, MAX_ZIJDE / Math.max(bitmap.width, bitmap.height));
    if (schaal === 1 && bestand.size <= KLEIN_GENOEG) {
      bitmap.close();
      return bestand;
    }
    const breedte = Math.round(bitmap.width * schaal);
    const hoogte = Math.round(bitmap.height * schaal);
    const canvas = document.createElement('canvas');
    canvas.width = breedte;
    canvas.height = hoogte;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, breedte, hoogte);
    bitmap.close();

    const blob = await new Promise<Blob | null>((klaar) =>
      canvas.toBlob(klaar, 'image/jpeg', KWALITEIT),
    );
    if (!blob || blob.size >= bestand.size) return bestand;
    return new File([blob], `${bestand.name.replace(/\.[^.]+$/, '')}.jpg`, {
      type: 'image/jpeg',
    });
  } catch {
    return bestand;
  }
}

function mb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  /** Veldnaam in het formulier (server-actie leest fd.getAll(name)). */
  name?: string;
  /** Meerdere foto's tegelijk toestaan. */
  multiple?: boolean;
}

/**
 * Fotoveld dat de gekozen foto's eerst in de browser verkleint. Zonder dat
 * lopen telefoonfoto's tegen de bovengrens van een Server Action aan.
 */
export default function FotoKiezer({ name = 'foto', multiple = false }: Props) {
  const doorgeven = useRef<HTMLInputElement>(null);
  const [bezig, setBezig] = useState(false);
  const [gekozen, setGekozen] = useState<{ aantal: number; grootte: number } | null>(
    null,
  );

  async function kies(e: React.ChangeEvent<HTMLInputElement>) {
    const bestanden = Array.from(e.target.files ?? []);
    if (!doorgeven.current) return;
    if (bestanden.length === 0) {
      doorgeven.current.value = '';
      setGekozen(null);
      return;
    }

    setBezig(true);
    const verkleind = await Promise.all(bestanden.map(verklein));
    const overdracht = new DataTransfer();
    for (const f of verkleind) overdracht.items.add(f);
    doorgeven.current.files = overdracht.files;
    setGekozen({
      aantal: verkleind.length,
      grootte: verkleind.reduce((s, f) => s + f.size, 0),
    });
    setBezig(false);
  }

  const teGroot = (gekozen?.grootte ?? 0) > 3.5 * 1024 * 1024;

  return (
    <>
      <input type="file" accept="image/*" multiple={multiple} onChange={kies} />
      {/* Draagt de verkleinde bestanden naar de server-actie. */}
      <input ref={doorgeven} type="file" name={name} multiple={multiple} hidden />
      {bezig && (
        <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>
          Foto&apos;s verkleinen…
        </div>
      )}
      {!bezig && gekozen && (
        <div
          className={teGroot ? 'notice notice-err' : 'muted'}
          style={{ fontSize: 14, marginTop: 6 }}
        >
          {gekozen.aantal} foto{gekozen.aantal === 1 ? '' : "'s"} klaar —{' '}
          {mb(gekozen.grootte)}
          {teGroot && ' — dit is te veel in één keer, upload ze in twee delen.'}
        </div>
      )}
    </>
  );
}
