import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { Ronde, Lot } from '@/lib/types';
import TrekkingShow from './TrekkingShow';

export const dynamic = 'force-dynamic';

export default async function TrekkingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect('/beheer');
  const { id } = await params;
  const sb = serviceClient();

  const { data: rondeData } = await sb
    .from('rondes')
    .select('*')
    .eq('id', id)
    .single();
  const ronde = rondeData as Ronde | null;
  if (!ronde) notFound();

  const [{ data: exp }, { data: loten }] = await Promise.all([
    sb.from('experiences').select('titel').eq('ronde_id', id).order('sort'),
    sb
      .from('loten')
      .select('lotnummer, naam')
      .eq('ronde_id', id)
      .eq('betaald', true)
      .order('lotnummer', { ascending: true }),
  ]);

  const experiences = ((exp as { titel: string }[] | null) ?? []).map((e) => e.titel);
  const betaaldeLoten = (loten as Pick<Lot, 'lotnummer' | 'naam'>[] | null) ?? [];

  return (
    <TrekkingShow
      rondeId={ronde.id}
      rondeNaam={ronde.naam}
      datum={new Date().toISOString().slice(0, 10)}
      experiences={experiences}
      betaaldeLoten={betaaldeLoten}
    />
  );
}
