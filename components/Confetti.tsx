'use client';

import { useEffect, useState } from 'react';

const KLEUREN = ['#f4a416', '#17458f', '#1f9d55', '#e5b53f', '#d64545'];
const STUKS = 70;

interface Snipper {
  links: number;
  vertraging: number;
  duur: number;
  kleur: string;
  draai: number;
}

/**
 * Confetti voor het winnende moment. Wordt pas ná het mounten opgebouwd,
 * zodat de willekeur geen verschil geeft tussen server en browser.
 */
export default function Confetti() {
  const [snippers, setSnippers] = useState<Snipper[]>([]);

  useEffect(() => {
    setSnippers(
      Array.from({ length: STUKS }, () => ({
        links: Math.random() * 100,
        vertraging: Math.random() * 0.9,
        duur: 2.4 + Math.random() * 1.8,
        kleur: KLEUREN[Math.floor(Math.random() * KLEUREN.length)],
        draai: Math.random() * 360,
      })),
    );
  }, []);

  if (snippers.length === 0) return null;

  return (
    <div className="confetti" aria-hidden>
      {snippers.map((s, i) => (
        <span
          key={i}
          style={{
            left: `${s.links}%`,
            background: s.kleur,
            animationDelay: `${s.vertraging}s`,
            animationDuration: `${s.duur}s`,
            transform: `rotate(${s.draai}deg)`,
          }}
        />
      ))}
    </div>
  );
}
