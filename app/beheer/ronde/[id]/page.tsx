import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { euro, maandLabel } from '@/lib/format';
import type { Ronde, Experience, Lot } from '@/lib/types';
import {
  maakExperience,
  verwijderExperience,
  zetBetaald,
  verwijderLot,
  zetRondeStatus,
} from '@/lib/actions';
import DrawPanel from './DrawPanel';

export const dynamic = 'force-dynamic';

export default async function RondeBeheerPage({
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

  const [{ data: expData }, { data: lotData }] = await Promise.all([
    sb.from('experiences').select('*').eq('ronde_id', id).order('sort'),
    sb
      .from('loten')
      .select('*')
      .eq('ronde_id', id)
      .order('lotnummer', { ascending: true }),
  ]);

  const experiences = (expData as Experience[] | null) ?? [];
  const loten = (lotData as Lot[] | null) ?? [];
  const betaald = loten.filter((l) => l.betaald);
  const open = loten.length - betaald.length;

  // Opbrengst deze ronde (de week): totaal + per deelnemer.
  const totaalOpbrengst = betaald.reduce((s, l) => s + Number(l.bedrag ?? 0), 0);
  const perPersoonMap: Record<string, { naam: string; aantal: number; bedrag: number }> = {};
  for (const l of betaald) {
    const r = (perPersoonMap[l.naam] ??= { naam: l.naam, aantal: 0, bedrag: 0 });
    r.aantal += 1;
    r.bedrag += Number(l.bedrag ?? 0);
  }
  const perPersoon = Object.values(perPersoonMap).sort((a, b) => b.bedrag - a.bedrag);

  return (
    <>
      <p style={{ marginTop: 20 }}>
        <Link href="/beheer">← Terug naar beheer</Link>
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ margin: 0 }}>
          {ronde.naam}{' '}
          <span className="muted" style={{ fontWeight: 400, fontSize: 18 }}>
            · {maandLabel(ronde.maand)}
          </span>
        </h1>
        <div className="row-actions">
          {ronde.status === 'open' ? (
            <form action={zetRondeStatus}>
              <input type="hidden" name="id" value={ronde.id} />
              <input type="hidden" name="status" value="gesloten" />
              <button className="btn btn-ghost btn-sm">Ronde sluiten</button>
            </form>
          ) : (
            <form action={zetRondeStatus}>
              <input type="hidden" name="id" value={ronde.id} />
              <input type="hidden" name="status" value="open" />
              <button className="btn btn-ghost btn-sm">Ronde heropenen</button>
            </form>
          )}
        </div>
      </div>

      {/* ---------- Opbrengst deze ronde ---------- */}
      <section>
        <div className="section-head">
          <h2>Opbrengst deze ronde</h2>
          <span className="sub">
            {euro(totaalOpbrengst)} · {betaald.length} betaalde loten ·{' '}
            {perPersoon.length} deelnemers
          </span>
        </div>
        {perPersoon.length === 0 ? (
          <div className="empty">Nog geen betaalde inschrijvingen deze ronde.</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Deelnemer</th>
                  <th>Loten</th>
                  <th style={{ textAlign: 'right' }}>Betaald</th>
                </tr>
              </thead>
              <tbody>
                {perPersoon.map((r) => (
                  <tr key={r.naam}>
                    <td>{r.naam}</td>
                    <td>{r.aantal}</td>
                    <td style={{ textAlign: 'right' }}>{euro(r.bedrag)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Totaal</strong></td>
                  <td><strong>{betaald.length}</strong></td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>{euro(totaalOpbrengst)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Experiences ---------- */}
      <section>
        <div className="section-head">
          <h2>Experiences</h2>
          <span className="sub">Wat er te winnen is deze ronde</span>
        </div>
        {experiences.map((e) => (
          <div className="doel-row" key={e.id}>
            <div className="stack">
              <span className="naam">{e.titel}</span>
              {e.aanbieder && (
                <span className="omschrijving">Aangeboden door {e.aanbieder}</span>
              )}
              {e.omschrijving && (
                <span className="omschrijving">{e.omschrijving}</span>
              )}
            </div>
            <form action={verwijderExperience}>
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="ronde_id" value={ronde.id} />
              <button className="btn btn-danger btn-sm">Verwijder</button>
            </form>
          </div>
        ))}

        <form className="panel" action={maakExperience}>
          <input type="hidden" name="ronde_id" value={ronde.id} />
          <h3 style={{ marginTop: 0 }}>Experience toevoegen</h3>
          <div className="inline-form">
            <div>
              <label>Titel</label>
              <input name="titel" type="text" placeholder="Golf Experience met Stephen" required />
            </div>
            <div>
              <label>Aanbieder</label>
              <input name="aanbieder" type="text" placeholder="Lid" />
            </div>
          </div>
          <label>Omschrijving</label>
          <input name="omschrijving" type="text" />
          <div style={{ marginTop: 14 }}>
            <button className="btn" type="submit">
              Toevoegen
            </button>
          </div>
        </form>
      </section>

      {/* ---------- Trekking ---------- */}
      <section>
        <div className="section-head">
          <h2>Trekking</h2>
          <span className="sub">
            {betaald.length} betaalde loten doen mee
          </span>
        </div>

        <div className="panel" style={{ textAlign: 'center' }}>
          <p className="muted" style={{ marginTop: 0 }}>
            Doe de trekking live op je telefoon: groot in beeld, meerdere prijzen,
            hoofdprijs als climax.
          </p>
          <Link className="btn btn-gold btn-groot" href={`/beheer/ronde/${ronde.id}/trekking`}>
            🎉 Start presentatie-trekking
          </Link>
        </div>

        <details style={{ marginBottom: 20 }}>
          <summary className="muted" style={{ cursor: 'pointer' }}>
            Of trek snel één winnaar (zonder show)
          </summary>
          <div style={{ marginTop: 12 }}>
            <DrawPanel
              rondeId={ronde.id}
              datum={new Date().toISOString().slice(0, 10)}
              experiences={experiences.map((e) => e.titel)}
            />
          </div>
        </details>
      </section>

      {/* ---------- Loten ---------- */}
      <section>
        <div className="section-head">
          <h2>Loten</h2>
          <span className="sub">
            {loten.length} totaal · {betaald.length} betaald · {open} open
          </span>
        </div>

        {loten.length === 0 ? (
          <div className="empty">Nog geen loten. Bezoekers schrijven zich in via /meedoen.</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Naam</th>
                  <th>Contact</th>
                  <th>Betaald</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loten.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>#{l.lotnummer}</strong>
                    </td>
                    <td>{l.naam}</td>
                    <td className="muted">{l.contact ?? '—'}</td>
                    <td>
                      <span className={`pill ${l.betaald ? 'pill-ok' : 'pill-wait'}`}>
                        {l.betaald ? 'Betaald' : 'Open'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <form action={zetBetaald}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="ronde_id" value={ronde.id} />
                          <input
                            type="hidden"
                            name="betaald"
                            value={(!l.betaald).toString()}
                          />
                          <button
                            className={`btn btn-sm ${l.betaald ? 'btn-ghost' : ''}`}
                          >
                            {l.betaald ? 'Zet op open' : 'Afvinken'}
                          </button>
                        </form>
                        <form action={verwijderLot}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="ronde_id" value={ronde.id} />
                          <button className="btn btn-danger btn-sm">✕</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
