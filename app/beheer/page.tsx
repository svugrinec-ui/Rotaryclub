import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { euro, maandLabel, datumLabel } from '@/lib/format';
import { BUNDELS } from '@/lib/bundels';
import ConfirmButton from '@/components/ConfirmButton';
import { IconTrophy } from '@/components/Icons';
import type { Ronde, Doel, Winnaar } from '@/lib/types';
import {
  login,
  logout,
  maakRonde,
  zetRondeStatus,
  verwijderRonde,
  maakDoel,
  wijzigDoel,
  verwijderDoel,
  zetWinnaarPublicatie,
  zetWeekOpbrengst,
  verwijderWinnaar,
} from '@/lib/actions';

export const dynamic = 'force-dynamic';

const statusLabel: Record<string, string> = {
  open: 'Open',
  gesloten: 'Gesloten',
  getrokken: 'Getrokken',
};

export default async function BeheerPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  const { fout } = await searchParams;

  if (!(await isAdmin())) {
    return (
      <section style={{ maxWidth: 420, margin: '40px auto' }}>
        <div className="section-head">
          <h2>Commissie-beheer</h2>
        </div>
        <form className="panel" action={login}>
          {fout === 'wachtwoord' && (
            <div className="notice notice-err">Onjuist wachtwoord.</div>
          )}
          <label htmlFor="password">Wachtwoord</label>
          <input id="password" name="password" type="password" required autoFocus />
          <div style={{ marginTop: 16 }}>
            <button className="btn" type="submit">
              Inloggen
            </button>
          </div>
        </form>
      </section>
    );
  }

  const sb = serviceClient();
  const [{ data: rondesData }, { data: doelenData }, { data: winnaarsData }] =
    await Promise.all([
      sb.from('rondes').select('*').order('maand', { ascending: false }),
      sb
        .from('doelen')
        .select('*')
        .order('maand', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
      sb.from('winnaars').select('*').order('maand', { ascending: false }),
    ]);

  const rondes = (rondesData as Ronde[] | null) ?? [];
  const doelen = (doelenData as Doel[] | null) ?? [];
  const winnaars = (winnaarsData as Winnaar[] | null) ?? [];
  const vandaag = new Date().toISOString().slice(0, 10);
  const dezeMaand = vandaag.slice(0, 8) + '01';
  // Snelknop trekking hoort bij een lopende (open) loterijronde.
  const openRonde = rondes.find((r) => r.status === 'open') ?? null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>Commissie-beheer</h1>
        <div className="row-actions">
          <Link className="btn btn-ghost btn-sm" href="/beheer/qr">
            QR-code
          </Link>
          <form action={logout}>
            <button className="btn btn-ghost btn-sm" type="submit">
              Uitloggen
            </button>
          </form>
        </div>
      </div>

      {/* ---------- Snelknop: live trekking (alleen bij een open ronde) ---------- */}
      {openRonde ? (
        <Link
          className="btn btn-gold btn-groot"
          href={`/beheer/ronde/${openRonde.id}/trekking`}
          style={{ display: 'flex', width: '100%', marginTop: 18, justifyContent: 'center' }}
        >
          <IconTrophy size={20} /> Start trekking — {openRonde.naam}
        </Link>
      ) : (
        <button
          className="btn btn-gold btn-groot"
          disabled
          style={{ display: 'flex', width: '100%', marginTop: 18, justifyContent: 'center' }}
          title="Open eerst een loterijronde om te trekken"
        >
          <IconTrophy size={20} /> Start trekking — geen open ronde
        </button>
      )}

      {/* ---------- Rondes ---------- */}
      <section>
        <div className="section-head">
          <h2>Loterijrondes</h2>
          <span className="sub">Open een ronde, beheer loten en trek winnaars</span>
        </div>

        {rondes.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Ronde</th>
                  <th>Maand</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rondes.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/beheer/ronde/${r.id}`}>{r.naam}</Link>
                    </td>
                    <td>{maandLabel(r.maand)}</td>
                    <td>
                      <span
                        className={`pill ${
                          r.status === 'open' ? 'pill-ok' : 'pill-wait'
                        }`}
                      >
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={`/beheer/ronde/${r.id}`}
                        >
                          Beheer
                        </Link>
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={`/beheer/ronde/${r.id}/trekking`}
                        >
<IconTrophy size={15} /> Trekking
                        </Link>
                        {r.status !== 'open' && (
                          <form action={zetRondeStatus}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="open" />
                            <button className="btn btn-ghost btn-sm">Open</button>
                          </form>
                        )}
                        {r.status === 'open' && (
                          <form action={zetRondeStatus}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="gesloten" />
                            <button className="btn btn-ghost btn-sm">Sluit</button>
                          </form>
                        )}
                        <form action={verwijderRonde}>
                          <input type="hidden" name="id" value={r.id} />
                          <ConfirmButton
                            className="btn btn-danger btn-sm"
                            message={`Ronde "${r.naam}" verwijderen? De loten, experiences én de winnaar van deze ronde (incl. de opbrengst in het overzicht) gaan mee.`}
                          >
                            Verwijder
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form className="panel" action={maakRonde}>
          <h3 style={{ marginTop: 0 }}>Nieuwe ronde</h3>
          <div className="inline-form">
            <div>
              <label htmlFor="r-naam">Naam</label>
              <input id="r-naam" name="naam" type="text" placeholder="Rotary avond" required />
            </div>
            <div>
              <label htmlFor="r-maand">Datum</label>
              <input id="r-maand" name="maand" type="date" defaultValue={dezeMaand} required />
            </div>
          </div>
          <div className="inline-form">
            <div>
              <label htmlFor="r-exp">Hoofdprijs (experience)</label>
              <input
                id="r-exp"
                name="experience"
                type="text"
                placeholder="Onvergetelijke ervaring"
                required
              />
            </div>
            <div>
              <label htmlFor="r-aanb">Aangeboden door</label>
              <input id="r-aanb" name="aanbieder" type="text" placeholder="Rotarian" required />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn" type="submit">
              Ronde toevoegen
            </button>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            Elke ronde gebruikt dezelfde lotbundels:{' '}
            {BUNDELS.map((b) => `${euro(b.bedrag)} = ${b.loten} loten`).join(' · ')}.
          </p>
        </form>
      </section>

      {/* ---------- Winnaars ---------- */}
      <section>
        <div className="section-head">
          <h2>Winnaars-galerij</h2>
          <span className="sub">Publiceer winnaars met een foto</span>
        </div>

        {winnaars.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Winnaar</th>
                  <th>Experience</th>
                  <th>Zichtbaar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {winnaars.map((w) => (
                  <tr key={w.id}>
                    <td>{datumLabel(w.maand)}</td>
                    <td>{w.naam}</td>
                    <td>{w.experience_titel}</td>
                    <td>
                      <span className={`pill ${w.gepubliceerd ? 'pill-ok' : 'pill-wait'}`}>
                        {w.gepubliceerd ? 'Online' : 'Verborgen'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn btn-ghost btn-sm" href={`/beheer/winnaar/${w.id}`}>
                          Bewerk
                        </Link>
                        <form action={zetWinnaarPublicatie}>
                          <input type="hidden" name="id" value={w.id} />
                          <input
                            type="hidden"
                            name="gepubliceerd"
                            value={(!w.gepubliceerd).toString()}
                          />
                          <button className="btn btn-ghost btn-sm">
                            {w.gepubliceerd ? 'Verberg' : 'Publiceer'}
                          </button>
                        </form>
                        <form action={verwijderWinnaar}>
                          <input type="hidden" name="id" value={w.id} />
                          <button className="btn btn-danger btn-sm">Verwijder</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="muted">
          Winnaars komen automatisch uit de{' '}
          <span style={{ fontWeight: 600 }}>presentatie-trekking</span>. Hier beheer
          je ze: publiceren/verbergen, foto toevoegen (Bewerk) of verwijderen.
        </p>
      </section>

      {/* ---------- Goede doelen (ingeklapt) ---------- */}
      <details className="beheer-inklap">
        <summary>Goede doelen — waar het geld per maand naartoe gaat</summary>
        <div style={{ marginTop: 6 }} />

        <form className="panel" action={maakDoel}>
          <h3 style={{ marginTop: 0 }}>Nieuw goed doel</h3>
          <div className="inline-form">
            <div>
              <label>Naam</label>
              <input name="naam" type="text" required />
            </div>
            <div>
              <label>Maand</label>
              <input name="maand" type="month" defaultValue={dezeMaand.slice(0, 7)} />
            </div>
          </div>
          <label>Omschrijving</label>
          <input name="omschrijving" type="text" placeholder="Korte toelichting op het doel (optioneel)" />
          <label>Foto (optioneel)</label>
          <input name="foto" type="file" accept="image/*" />
          <input type="hidden" name="jaar" value={new Date().getFullYear()} />
          <div style={{ marginTop: 14 }}>
            <button className="btn" type="submit">
              Doel toevoegen
            </button>
          </div>
        </form>

        {doelen.map((d) => (
          <form className="panel" action={wijzigDoel} key={d.id}>
            <input type="hidden" name="id" value={d.id} />
            <div className="inline-form">
              <div>
                <label>Naam</label>
                <input name="naam" type="text" defaultValue={d.naam} required />
              </div>
              <div>
                <label>Maand</label>
                <input name="maand" type="month" defaultValue={d.maand?.slice(0, 7) ?? ''} />
              </div>
            </div>
            <label>Omschrijving</label>
            <input name="omschrijving" type="text" defaultValue={d.omschrijving ?? ''} />
            {d.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.foto_url}
                alt=""
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, margin: '10px 0 0' }}
              />
            )}
            <label>{d.foto_url ? 'Foto vervangen (optioneel)' : 'Foto toevoegen (optioneel)'}</label>
            <input name="foto" type="file" accept="image/*" />
            <input type="hidden" name="jaar" value={d.jaar ?? ''} />
            <div className="row-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-sm" type="submit">
                Opslaan
              </button>
              <button className="btn btn-danger btn-sm" formAction={verwijderDoel}>
                Verwijderen
              </button>
            </div>
          </form>
        ))}
      </details>

      {/* ---------- Opbrengst per week (handmatig, ingeklapt) ---------- */}
      <details className="beheer-inklap">
        <summary>Opbrengst per week — handmatig bijstellen</summary>
        <p className="muted" style={{ marginTop: 10 }}>
          De opbrengst per ronde wordt automatisch berekend uit de betalingen (zie
          “Opbrengst deze ronde” bij een ronde). Dit blok is alleen om de publieke
          “Opbouw per week” met de hand bij te stellen. Totaal nu:{' '}
          {euro(winnaars.reduce((s, w) => s + Number(w.opbrengst ?? 0), 0))}.
        </p>
        {winnaars.length === 0 ? (
          <div className="empty">
            Nog geen weken. Leg eerst een winnaar vast; daar hoort de weekopbrengst bij.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Experience</th>
                  <th>Opbrengst (€)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...winnaars]
                  .sort((a, b) => b.maand.localeCompare(a.maand))
                  .map((w) => (
                    <tr key={w.id}>
                      <td>{datumLabel(w.maand)}</td>
                      <td>{w.experience_titel}</td>
                      <td colSpan={2}>
                        <form action={zetWeekOpbrengst} className="inline-form">
                          <input type="hidden" name="id" value={w.id} />
                          <input
                            name="opbrengst"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={Number(w.opbrengst ?? 0)}
                            style={{ maxWidth: 140 }}
                          />
                          <button className="btn btn-sm" type="submit">
                            Opslaan
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </>
  );
}
