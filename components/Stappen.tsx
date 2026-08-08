const STAP_ICONEN: Record<number, React.ReactNode> = {
  1: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  2: (
    <>
      <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </>
  ),
  3: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  // Beker: de trekking zelf sluit de rij af.
  4: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 5H5a2 2 0 0 0 0 4h2" />
    </>
  ),
};

const STAP_LABELS: Record<number, string> = {
  1: 'Naam & bundel',
  2: 'Je loten',
  3: 'Betalen',
  4: 'Trekking',
};

interface Props {
  actief: 1 | 2 | 3 | 4;
  /** Op het donkere live-scherm van de trekking. */
  donker?: boolean;
}

/**
 * De vier stappen van meedoen. Stap 4 (de trekking) hoort er bewust bij: als de
 * trekking het scherm overneemt, zie je dát je een stap verder bent in dezelfde
 * route — niet dat je pagina zomaar vervangen is.
 */
export default function Stappen({ actief, donker }: Props) {
  return (
    <ol className={`stappen${donker ? ' donker' : ''}`}>
      {([1, 2, 3, 4] as const).map((n) => (
        <li key={n} className={actief === n ? 'actief' : ''}>
          <span className="stap-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {STAP_ICONEN[n]}
            </svg>
          </span>
          <span>
            <span className="stap-num">{n}.</span> {STAP_LABELS[n]}
          </span>
        </li>
      ))}
    </ol>
  );
}
