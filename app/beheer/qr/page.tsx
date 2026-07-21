import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { isAdmin } from '@/lib/auth';
import { euro } from '@/lib/format';
import { BUNDELS } from '@/lib/bundels';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export default async function QrPage() {
  if (!(await isAdmin())) redirect('/beheer');

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3200';
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const url = `${proto}://${host}/meedoen`;

  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: { dark: '#17458f', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  return (
    <>
      <p style={{ marginTop: 20 }} className="no-print">
        <Link href="/beheer">← Terug naar beheer</Link>
      </p>

      <div className="qr-print">
        <h2>Doe mee met de loterij</h2>
        <p className="muted">Scan de code met je telefoon</p>

        <div className="qr-holder" dangerouslySetInnerHTML={{ __html: svg }} />

        <div className="qr-bundels">
          {BUNDELS.map((b) => (
            <span key={b.bedrag}>
              {euro(b.bedrag)} = {b.loten} loten
            </span>
          ))}
        </div>

        <p className="qr-url">{url}</p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }} className="no-print">
        <PrintButton />
      </div>
    </>
  );
}
