import { serviceClient } from './supabase';
import type { Instellingen } from './types';

// Standaardteksten voor de export-mail (gebruikt als de instelling leeg is).
export const MAIL_INTRO_STANDAARD =
  'Hierbij het financiële overzicht van de loterij. De volledige details vind je in het bijgevoegde Excel-bestand.';
export const MAIL_AFSLUITING_STANDAARD = 'Met vriendelijke groet,\nDe loterijcommissie';

// Leest de (enige) instellingen-rij. Server-side; de tabel is niet publiek.
export async function getInstellingen(): Promise<Instellingen | null> {
  const { data } = await serviceClient()
    .from('instellingen')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  return (data as Instellingen | null) ?? null;
}
