export type RondeStatus = 'open' | 'gesloten' | 'getrokken';

export interface Ronde {
  id: string;
  naam: string;
  maand: string; // ISO date
  status: RondeStatus;
  lotprijs: number;
  opbrengst: number; // som van de betaalde loten; bijgewerkt bij afvinken/sluiten
  created_at: string;
}

export interface Experience {
  id: string;
  ronde_id: string;
  titel: string;
  omschrijving: string | null;
  aanbieder: string | null;
  sort: number;
  created_at: string;
}

export interface Lot {
  id: string;
  ronde_id: string;
  lotnummer: number;
  naam: string;
  contact: string | null;
  betaald: boolean;
  betaald_op: string | null;
  bedrag: number; // betaald bedrag voor dit lot (bundelbedrag verdeeld over de loten)
  betaalwijze: 'bank' | 'cash'; // hoe er betaald wordt
  created_at: string;
}

export interface Winnaar {
  id: string;
  ronde_id: string | null;
  maand: string; // ISO date
  naam: string;
  experience_titel: string;
  aanbieder: string | null; // wie de experience aanbood
  toelichting: string | null;
  foto_url: string | null;
  opbrengst: number; // opbrengst voor het goede doel in deze loterijweek
  gepubliceerd: boolean;
  created_at: string;
}

export interface Instellingen {
  id: number;
  penningmeester_naam: string | null;
  penningmeester_email: string | null;
  afzender: string | null; // afzenderadres voor de export-mail (Resend)
  mail_intro: string | null; // bewerkbare intro-tekst van de export-mail
  mail_afsluiting: string | null; // bewerkbare afsluiting/ondertekening
  updated_at: string;
}

export interface Doel {
  id: string;
  naam: string;
  omschrijving: string | null;
  opbrengst: number;
  jaar: number | null;
  maand: string | null; // eerste van de maand waarvoor dit doel geldt
  foto_url: string | null; // teaser-foto bij het goede doel
  sort: number;
  created_at: string;
}
