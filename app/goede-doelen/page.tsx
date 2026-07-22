import { publicClient } from '@/lib/supabase';
import { euro, datumLabel, maandLabel, bestuursjaar } from '@/lib/format';
import { maandVoortgang, doelVoorMaand } from '@/lib/doel';
import DoelMeter from '@/components/DoelMeter';
import type { Doel, Winnaar } from '@/lib/types';

export const revalidate = 60;

export default async function GoedeDoelenPage() {
  const sb = publicClient();

  const [{ data: doelenData }, { data: winnaarsData }] = await Promise.all([
    sb
      .from('doelen')
      .select('*')
      .order('sort', { ascending: true })
      .order('created_at', { ascending: true }),
    sb
      .from('winnaars')
      .select('*')
      .eq('gepubliceerd', true)
      .order('maand', { ascending: true }),
  ]);

  const doelen = (doelenData as Doel[] | null) ?? [];
  const winnaars = (winnaarsData as Winnaar[] | null) ?? [];

  // Opbouw per week: elke loterijweek met een oplopend totaal.
  let loper = 0;
  const weken = winnaars
    .filter((w) => Number(w.opbrengst ?? 0) > 0)
    .map((w) => {
      loper += Number(w.opbrengst);
      return { w, bedrag: Number(w.opbrengst), cumulatief: loper };
    });

  const doelenSom = doelen.reduce((s, d) => s + Number(d.opbrengst), 0);
  const voortgang = maandVoortgang(winnaars);
  const huidigDoel = doelVoorMaand(doelen, voortgang.maandIso);

  // Totaal over het lopende Rotary-bestuursjaar (juli–juni).
  const referentie =
    winnaars.length > 0 ? winnaars[winnaars.length - 1].maand : new Date().toISOString();
  const bj = bestuursjaar(referentie);
  const bjSom = winnaars.reduce(
    (s, w) => (bestuursjaar(w.maand).start === bj.start ? s + Number(w.opbrengst ?? 0) : s),
    0,
  );
  const jaarTotaal = bjSom > 0 ? bjSom : doelenSom;

  return (
    <>
      <section className="hero">
        <h1>
          Goede doelen &amp; <span className="gold">opbrengsten</span>
        </h1>
        <p>
          De opbrengst van de loterij gaat volledig naar goede doelen. Hieronder
          zie je hoe het bedrag week na week is opgebouwd.
        </p>
      </section>

      <DoelMeter
        voortgang={voortgang}
        doelNaam={huidigDoel?.naam}
        doelLabel="Deze maand naar"
      />

      <section>
        <div className="section-head">
          <h2>Waar gaat het naartoe</h2>
        </div>
        {doelen.length === 0 ? (
          <div className="empty">Er zijn nog geen goede doelen toegevoegd.</div>
        ) : (
          doelen.map((d) => (
            <div className="doel-row" key={d.id}>
              <div className="doel-row-left">
                {d.foto_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="doel-foto" src={d.foto_url} alt="" />
                )}
                <div className="stack">
                  <span className="naam">
                    {d.naam}
                    {d.maand ? (
                      <span className="muted"> · {maandLabel(d.maand)}</span>
                    ) : d.jaar ? (
                      <span className="muted"> · {d.jaar}</span>
                    ) : null}
                  </span>
                  {d.omschrijving && (
                    <span className="omschrijving">{d.omschrijving}</span>
                  )}
                </div>
              </div>
              {Number(d.opbrengst) > 0 && (
                <div className="bedrag">{euro(Number(d.opbrengst))}</div>
              )}
            </div>
          ))
        )}
      </section>

      {weken.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Opbouw per week</h2>
            <span className="sub">Elke dinsdagavond telt mee</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Experience</th>
                  <th style={{ textAlign: 'right' }}>Opbrengst</th>
                  <th style={{ textAlign: 'right' }}>Totaal tot nu toe</th>
                </tr>
              </thead>
              <tbody>
                {[...weken].reverse().map(({ w, bedrag, cumulatief }) => (
                  <tr key={w.id}>
                    <td>{datumLabel(w.maand)}</td>
                    <td>{w.experience_titel}</td>
                    <td style={{ textAlign: 'right' }}>{euro(bedrag)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {euro(cumulatief)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {jaarTotaal > 0 && (
        <div className="jaar-totaal">
          <span>Totaal opgehaald in bestuursjaar {bj.label}</span>
          <strong>{euro(jaarTotaal)}</strong>
        </div>
      )}
    </>
  );
}
