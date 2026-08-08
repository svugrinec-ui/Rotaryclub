import { serviceClient } from '@/lib/supabase';

/** Som van de betaalde loten van een ronde = de opbrengst van die (week-)ronde. */
export async function rondeOpbrengst(rondeId: string): Promise<number> {
  const { data } = await serviceClient()
    .from('loten')
    .select('bedrag')
    .eq('ronde_id', rondeId)
    .eq('betaald', true);
  const som = (data ?? []).reduce((s, l) => s + Number(l.bedrag ?? 0), 0);
  return Math.round(som * 100) / 100;
}

/**
 * Schrijft de actuele opbrengst (som van de betaalde loten) naar de ronde zelf.
 * Bron van waarheid voor het publieke totaal; roep dit aan zodra betalingen
 * wijzigen — dus ook meteen bij het inschrijven, zodat de maandmeter live
 * meebeweegt tijdens de loterijavond. De update op `rondes` is tevens het
 * realtime-signaal waarop de publieke pagina's meeluisteren.
 */
export async function syncRondeOpbrengst(rondeId: string): Promise<number> {
  const opbrengst = await rondeOpbrengst(rondeId);
  await serviceClient().from('rondes').update({ opbrengst }).eq('id', rondeId);
  return opbrengst;
}
