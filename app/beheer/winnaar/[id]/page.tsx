import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { Winnaar } from '@/lib/types';
import { wijzigWinnaar } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function WinnaarBewerkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect('/beheer');
  const { id } = await params;

  const { data } = await serviceClient()
    .from('winnaars')
    .select('*')
    .eq('id', id)
    .single();
  const w = data as Winnaar | null;
  if (!w) notFound();

  return (
    <>
      <p style={{ marginTop: 20 }}>
        <Link href="/beheer">← Terug naar beheer</Link>
      </p>
      <h1>Winnaar bewerken</h1>

      <form className="panel" action={wijzigWinnaar}>
        <input type="hidden" name="id" value={w.id} />

        {w.foto_url && (
          <div style={{ marginBottom: 16 }}>
            <label>Huidige foto</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={w.foto_url}
              alt=""
              style={{ maxWidth: 280, borderRadius: 12, display: 'block' }}
            />
          </div>
        )}

        <label>Naam winnaar</label>
        <input name="naam" type="text" defaultValue={w.naam} required />

        <label>Experience</label>
        <input
          name="experience_titel"
          type="text"
          defaultValue={w.experience_titel}
          required
        />

        <label>Datum trekking</label>
        <input name="maand" type="date" defaultValue={w.maand.slice(0, 10)} required />

        <label>Opbrengst deze week (€)</label>
        <input
          name="opbrengst"
          type="number"
          step="0.01"
          min="0"
          defaultValue={Number(w.opbrengst ?? 0)}
        />

        <label>Toelichting (optioneel)</label>
        <textarea name="toelichting" defaultValue={w.toelichting ?? ''} />

        <label>{w.foto_url ? 'Foto vervangen (optioneel)' : 'Foto toevoegen (optioneel)'}</label>
        <input name="foto" type="file" accept="image/*" />

        <div style={{ marginTop: 16 }}>
          <button className="btn" type="submit">
            Opslaan
          </button>
        </div>
      </form>
    </>
  );
}
