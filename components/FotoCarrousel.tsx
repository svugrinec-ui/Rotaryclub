'use client';

import { useEffect, useState } from 'react';

const INTERVAL = 4500; // ms dat een foto blijft staan

interface Props {
  fotos: string[];
  /** Extra wachttijd op de eerste foto, zodat kaarten niet gelijk wisselen. */
  vertraging?: number;
}

/**
 * Winnaarsfoto's die vanzelf doorlopen. Staat stil bij muis/toetsenbord op de
 * kaart en bij "verminderde beweging", zodat lezen niet gestoord wordt.
 */
export default function FotoCarrousel({ fotos, vertraging = 0 }: Props) {
  const [index, setIndex] = useState(0);
  const [pauze, setPauze] = useState(false);

  useEffect(() => {
    if (fotos.length < 2 || pauze) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wachttijd = index === 0 ? INTERVAL + vertraging : INTERVAL;
    const t = setTimeout(
      () => setIndex((i) => (i + 1) % fotos.length),
      wachttijd,
    );
    return () => clearTimeout(t);
  }, [index, pauze, fotos.length, vertraging]);

  return (
    <div
      className="card-photo carrousel"
      onMouseEnter={() => setPauze(true)}
      onMouseLeave={() => setPauze(false)}
      onFocus={() => setPauze(true)}
      onBlur={() => setPauze(false)}
    >
      {fotos.map((src, i) => (
        <div
          key={src}
          className={`carrousel-foto${i === index ? ' actief' : ''}`}
          // --foto vult zowel de foto zelf als de vervaagde achtergrondrand.
          style={{ '--foto': `url(${src})` } as React.CSSProperties}
          aria-hidden={i !== index}
        />
      ))}

      {fotos.length > 1 && (
        <div className="carrousel-dots">
          {fotos.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === index ? 'actief' : undefined}
              aria-label={`Foto ${i + 1} van ${fotos.length}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
