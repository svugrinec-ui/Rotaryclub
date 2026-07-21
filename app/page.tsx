import Link from 'next/link';
import { publicClient } from '@/lib/supabase';
import { datumLabel } from '@/lib/format';
import { maandVoortgang, doelVoorMaand } from '@/lib/doel';
import DoelMeter from '@/components/DoelMeter';
import type { Winnaar, Doel } from '@/lib/types';

export const revalidate = 60;

export default async function HomePage() {
  const sb = publicClient();

  const [{ data: winnaars }, { data: doelen }] = await Promise.all([
    sb
      .from('winnaars')
      .select('*')
      .eq('gepubliceerd', true)
      .order('maand', { ascending: false })
      .limit(24),
    sb.from('doelen').select('*'),
  ]);

  const lijst = (winnaars as Winnaar[] | null) ?? [];
  const doelenLijst = (doelen as Doel[] | null) ?? [];
  const voortgang = maandVoortgang(lijst);
  const huidigDoel = doelVoorMaand(doelenLijst, voortgang.maandIso);

  return (
    <>
      <section className="hero">
        <h1>
          Van prijzen naar <span className="gold">ervaringen</span>
        </h1>
        <p>
          Elke maand verloten we bijzondere Rotary Experiences, aangeboden door
          onze eigen leden. Hier zie je wie er won — en welke mooie ervaring ze
          deelden.
        </p>
      </section>

      <Link href="/goede-doelen" style={{ textDecoration: 'none', color: 'inherit' }}>
        <DoelMeter
          voortgang={voortgang}
          doelNaam={huidigDoel?.naam}
          doelLabel="Deze maand voor"
        />
      </Link>

      <section>
        <div className="section-head">
          <h2>Winnaars per maand</h2>
          <span className="sub">De laatste Rotary Experiences</span>
        </div>

        {lijst.length === 0 ? (
          <div className="empty">
            Nog geen winnaars gepubliceerd. Kom snel terug — of{' '}
            <Link href="/meedoen">doe mee met de loterij</Link>.
          </div>
        ) : (
          <div className="grid">
            {lijst.map((w) => (
              <article className="card" key={w.id}>
                <div
                  className="card-photo"
                  style={
                    w.foto_url
                      ? { backgroundImage: `url(${w.foto_url})` }
                      : undefined
                  }
                >
                  {!w.foto_url && <span className="placeholder">🏅</span>}
                </div>
                <div className="card-body">
                  <span className="maand">{datumLabel(w.maand)}</span>
                  <h3>{w.experience_titel}</h3>
                  <div className="winnaar">Gewonnen door {w.naam}</div>
                  {w.toelichting && (
                    <p className="toelichting">{w.toelichting}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
