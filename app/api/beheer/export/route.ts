import { isAdmin } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import { financieelCsv, exportBestandsnaam } from '@/lib/export';
import type { Ronde, Lot } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Financieel overzicht als CSV-download. Alleen voor beheer. Optioneel filter:
// ?ronde=<id>&ronde=<id> — anders alle rondes.
export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return new Response('Geen toegang.', { status: 403 });
  }

  const gekozen = new URL(req.url).searchParams.getAll('ronde').filter(Boolean);

  const sb = serviceClient();
  // Niets aangevinkt = niets exporteren (alleen de gekozen rondes tellen mee).
  const { data: rondesData } = await sb.from('rondes').select('*');
  let loten: Lot[] = [];
  if (gekozen.length > 0) {
    const { data } = await sb.from('loten').select('*').in('ronde_id', gekozen);
    loten = (data as Lot[] | null) ?? [];
  }

  const csv = financieelCsv((rondesData as Ronde[] | null) ?? [], loten);
  const vandaag = new Date().toISOString();

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportBestandsnaam(vandaag)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
