import { publicClient } from '@/lib/supabase';
import { euro, datumLabel, maandLabel, bestuursjaar } from '@/lib/format';
import { maandVoortgang, doelVoorMaand, MAANDDOEL } from '@/lib/doel';
import { bouwWeken, maandTotalen, huidigeEnVorige } from '@/lib/opbrengst';
import DoelMeter from '@/components/DoelMeter';
import type { Doel, Winnaar, Ronde } from '@/lib/types';

export const revalidate = 60;

export default async function GoedeDoelenPage() {
  const sb = publicClient();

  const [{ data: doelenData }, { data: winnaarsData }, { data: rondesData }] =
    await Promise.all([
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
      sb.from('rondes').select('*'),
    ]);

  const doelen = (doelenData as Doel[] | null) ?? [];
  const winnaars = (winnaarsData as Winnaar[] | null) ?? [];
  const rondes = (rondesData as Ronde[] | null) ?? [];

  // Opbouw per week: afgesloten rondes + oude losse winnaars, oplopend totaal.
  let loper = 0;
  const weken = bouwWeken(rondes, winnaars).map((w) => {
    loper += w.opbrengst;
    return { w, bedrag: w.opbrengst, cumulatief: Math.round(loper * 100) / 100 };
  });

  const doelenSom = doelen.reduce((s, d) => s + Number(d.opbrengst), 0);

  // Maanddoel-meter: de laatste maand met een ronde telt (reset per maand);
  // de maand ervoor tonen we subtiel als "vorige maand".
  const maanden = maandTotalen(rondes, winnaars);
  const { huidig, vorig } = huidigeEnVorige(maanden, new Date().toISOString().slice(0, 7));
  const voortgang = maandVoortgang(
    huidig ? [{ maand: huidig.maandIso, opbrengst: huidig.opbrengst }] : [],
  );
  const huidigDoel = doelVoorMaand(doelen, voortgang.maandIso);
  const vorige = vorig
    ? { maandNaam: maandLabel(vorig.maandIso), opgehaald: vorig.opbrengst, doel: MAANDDOEL }
    : null;

  // Totaal over het lopende Rotary-bestuursjaar (juli–juni).
  const referentie =
    weken.length > 0 ? weken[weken.length - 1].w.maand : new Date().toISOString();
  const bj = bestuursjaar(referentie);
  const bjSom = weken.reduce(
    (s, { w }) => (bestuursjaar(w.maand).start === bj.start ? s + w.opbrengst : s),
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
        vorige={vorige}
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
                  <tr key={w.key}>
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
