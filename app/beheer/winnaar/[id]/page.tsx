import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { Winnaar } from '@/lib/types';
import { wijzigWinnaar, verwijderWinnaar } from '@/lib/actions';
import ConfirmButton from '@/components/ConfirmButton';

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

        <label>Aangeboden door (optioneel)</label>
        <input name="aanbieder" type="text" defaultValue={w.aanbieder ?? ''} />

        <label>Datum trekking</label>
        <input name="maand" type="date" defaultValue={w.maand.slice(0, 10)} required />

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

      <details style={{ marginTop: 28 }}>
        <summary className="muted" style={{ cursor: 'pointer', fontSize: 14 }}>
          Winnaar verwijderen
        </summary>
        <div className="panel" style={{ marginTop: 10 }}>
          <p className="muted" style={{ marginTop: 0 }}>
            Haalt deze winnaar uit de galerij — definitief. Wil je 'm alleen
            tijdelijk verbergen, gebruik dan “Verberg” in het overzicht.
          </p>
          <form action={verwijderWinnaar}>
            <input type="hidden" name="id" value={w.id} />
            <ConfirmButton
              className="btn btn-danger btn-sm"
              message={`Winnaar "${w.naam}" verwijderen uit de galerij?`}
            >
              Ja, verwijder deze winnaar
            </ConfirmButton>
          </form>
        </div>
      </details>
    </>
  );
}
