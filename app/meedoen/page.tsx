import { publicClient } from '@/lib/supabase';
import { maandVoortgang, doelVoorMaand } from '@/lib/doel';
import DoelMeter from '@/components/DoelMeter';
import type { Ronde, Experience, Winnaar, Doel } from '@/lib/types';
import MeedoenForm from './MeedoenForm';

export const revalidate = 30;

export default async function MeedoenPage() {
  const sb = publicClient();

  const [{ data: rondes }, { data: winnaars }, { data: doelen }] = await Promise.all([
    sb
      .from('rondes')
      .select('*')
      .eq('status', 'open')
      .order('maand', { ascending: false })
      .limit(1),
    sb.from('winnaars').select('maand,opbrengst').eq('gepubliceerd', true),
    sb.from('doelen').select('*'),
  ]);

  const ronde = (rondes as Ronde[] | null)?.[0] ?? null;
  const doelenLijst = (doelen as Doel[] | null) ?? [];
  const voortgang = maandVoortgang((winnaars as Pick<Winnaar, 'maand' | 'opbrengst'>[] | null) ?? []);
  const huidigDoel = doelVoorMaand(doelenLijst, ronde?.maand ?? voortgang.maandIso);

  let experiences: Experience[] = [];
  if (ronde) {
    const { data: exp } = await sb
      .from('experiences')
      .select('*')
      .eq('ronde_id', ronde.id)
      .order('sort', { ascending: true });
    experiences = (exp as Experience[] | null) ?? [];
  }

  if (!ronde) {
    return (
      <>
        <section className="hero">
          <h1>Meedoen met de loterij</h1>
          <p>Op dit moment is er geen loterijronde open. Kom snel terug!</p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="hero">
        <h1>
          Doe mee — <span className="gold">{ronde.naam}</span>
        </h1>
        <p>
          Schrijf je in voor de loterij van deze maand. Kies een bundel, betaal
          via de bekende QR-code en vul hieronder je gegevens in — je krijgt
          direct je lotnummers.
        </p>
      </section>

      <DoelMeter
        voortgang={voortgang}
        titel="Samen naar het maanddoel"
        doelNaam={huidigDoel?.naam}
        motiverend
      />

      {experiences.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Dit kun je winnen</h2>
          </div>
          <div className="grid">
            {experiences.map((e) => (
              <article className="card" key={e.id}>
                <div className="card-body">
                  <h3>{e.titel}</h3>
                  {e.aanbieder && (
                    <div className="winnaar">Aangeboden door {e.aanbieder}</div>
                  )}
                  {e.omschrijving && (
                    <p className="toelichting">{e.omschrijving}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>Schrijf je in</h2>
        </div>
        <MeedoenForm rondeId={ronde.id} />
      </section>
    </>
  );
}
