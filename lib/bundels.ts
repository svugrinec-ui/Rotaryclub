// De loterij werkt met bundels: voor een vast bedrag krijg je een aantal loten.
// Pas deze lijst gerust aan — de rest van de app volgt automatisch.
//
// Patroon: elke stap van €5 levert er een extra bonuslot bovenop
// (3, 7, 11, 15) → hoe meer je koopt, hoe voordeliger.
//
// `qr` verwijst naar een betaal-QR-afbeelding in de map `public/`. Zet daar je
// eigen QR-plaatjes neer (bijv. public/betaal-qr/5.png). Ontbreekt er één, dan
// valt de meedoen-pagina terug op een algemene QR of een vriendelijke melding.

export interface Bundel {
  bedrag: number; // in euro's
  loten: number; // aantal loten dat je hiervoor krijgt
  betaalLink?: string; // Rabobank-betaalverzoek: opent de bank-app / iDEAL
  qr?: string; // betaal-QR-afbeelding (voor wie op een ander apparaat wil scannen)
  zelfBedrag?: boolean; // link zonder vast bedrag: betaler vult zelf het bedrag in
}

// Optionele algemene betaal-QR als er geen specifieke per bundel is.
export const BETAAL_QR_ALGEMEEN: string | undefined = undefined;

export const BUNDELS: Bundel[] = [
  {
    bedrag: 5,
    loten: 3,
    betaalLink: 'https://betaalverzoek.rabobank.nl/betaalverzoek/?id=aVc7byXLQfyDcxw9JmsplQ',
    qr: '/betaal-qr/5.png',
  },
  {
    bedrag: 10,
    loten: 7,
    betaalLink: 'https://betaalverzoek.rabobank.nl/betaalverzoek/?id=6B1Z_IykSfy15-hNHlrKtA',
    qr: '/betaal-qr/10.png',
  },
  {
    bedrag: 15,
    loten: 11,
    betaalLink: 'https://betaalverzoek.rabobank.nl/betaalverzoek/?id=TcZeFyANQxuPr8daSgTpBQ',
    qr: '/betaal-qr/15.png',
  },
  {
    // De €20-link is het "bedrag zelf bepalen"-betaalverzoek: vul €20 in.
    bedrag: 20,
    loten: 15,
    betaalLink: 'https://betaalverzoek.rabobank.nl/betaalverzoek/?id=WvohXnibT32TcPV_ahr1QQ',
    qr: '/betaal-qr/20.png',
    zelfBedrag: true,
  },
];

/** Zoekt de bundel bij een bedrag; null als het bedrag niet bestaat. */
export function bundelVoorBedrag(bedrag: number): Bundel | null {
  return BUNDELS.find((b) => b.bedrag === bedrag) ?? null;
}
