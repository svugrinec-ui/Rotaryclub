'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { serviceClient } from '@/lib/supabase';
import {
  ADMIN_COOKIE,
  cookieOptions,
  createSessionToken,
  checkPassword,
  isAdmin,
} from '@/lib/auth';

async function assertAdmin() {
  if (!(await isAdmin())) {
    throw new Error('Niet ingelogd.');
  }
}

function str(fd: FormData, key: string): string {
  return (fd.get(key)?.toString() ?? '').trim();
}

// ---------- Auth ----------
export async function login(fd: FormData) {
  const password = str(fd, 'password');
  if (!checkPassword(password)) {
    redirect('/beheer?fout=wachtwoord');
  }
  (await cookies()).set(ADMIN_COOKIE, createSessionToken(), cookieOptions);
  redirect('/beheer');
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect('/beheer');
}

// ---------- Rondes ----------
export async function maakRonde(fd: FormData) {
  await assertAdmin();
  const naam = str(fd, 'naam');
  const maand = str(fd, 'maand');
  const lotprijs = Number(str(fd, 'lotprijs')) || 5;
  if (!naam || !maand) return;
  await serviceClient().from('rondes').insert({ naam, maand, lotprijs });
  revalidatePath('/beheer');
  revalidatePath('/meedoen');
}

export async function zetRondeStatus(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  const status = str(fd, 'status');
  if (!id || !['open', 'gesloten', 'getrokken'].includes(status)) return;
  await serviceClient().from('rondes').update({ status }).eq('id', id);
  revalidatePath('/beheer');
  revalidatePath('/meedoen');
  revalidatePath(`/beheer/ronde/${id}`);
}

export async function verwijderRonde(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  if (!id) return;
  await serviceClient().from('rondes').delete().eq('id', id);
  revalidatePath('/beheer');
  revalidatePath('/meedoen');
}

// ---------- Experiences ----------
export async function maakExperience(fd: FormData) {
  await assertAdmin();
  const ronde_id = str(fd, 'ronde_id');
  const titel = str(fd, 'titel');
  if (!ronde_id || !titel) return;
  await serviceClient().from('experiences').insert({
    ronde_id,
    titel,
    omschrijving: str(fd, 'omschrijving') || null,
    aanbieder: str(fd, 'aanbieder') || null,
  });
  revalidatePath(`/beheer/ronde/${ronde_id}`);
  revalidatePath('/meedoen');
}

export async function verwijderExperience(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  const ronde_id = str(fd, 'ronde_id');
  if (!id) return;
  await serviceClient().from('experiences').delete().eq('id', id);
  revalidatePath(`/beheer/ronde/${ronde_id}`);
  revalidatePath('/meedoen');
}

// ---------- Loten ----------
export async function zetBetaald(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  const ronde_id = str(fd, 'ronde_id');
  const betaald = str(fd, 'betaald') === 'true';
  if (!id) return;
  await serviceClient()
    .from('loten')
    .update({ betaald, betaald_op: betaald ? new Date().toISOString() : null })
    .eq('id', id);
  revalidatePath(`/beheer/ronde/${ronde_id}`);
}

export async function verwijderLot(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  const ronde_id = str(fd, 'ronde_id');
  if (!id) return;
  await serviceClient().from('loten').delete().eq('id', id);
  revalidatePath(`/beheer/ronde/${ronde_id}`);
}

// ---------- Winnaars ----------
export async function maakWinnaar(fd: FormData) {
  await assertAdmin();
  const naam = str(fd, 'naam');
  const experience_titel = str(fd, 'experience_titel');
  const maand = str(fd, 'maand');
  const ronde_id = str(fd, 'ronde_id') || null;
  if (!naam || !experience_titel || !maand) return;

  const sb = serviceClient();

  let foto_url: string | null = null;
  const foto = fd.get('foto');
  if (foto instanceof File && foto.size > 0) {
    const ext = foto.name.split('.').pop()?.toLowerCase() || 'jpg';
    const pad = `winnaars/${maand}-${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await foto.arrayBuffer());
    const { error: upErr } = await sb.storage
      .from('fotos')
      .upload(pad, bytes, { contentType: foto.type || 'image/jpeg', upsert: true });
    if (!upErr) {
      foto_url = sb.storage.from('fotos').getPublicUrl(pad).data.publicUrl;
    }
  }

  await sb.from('winnaars').insert({
    naam,
    experience_titel,
    maand,
    ronde_id,
    toelichting: str(fd, 'toelichting') || null,
    opbrengst: Number(str(fd, 'opbrengst')) || 0,
    foto_url,
    gepubliceerd: true,
  });
  revalidatePath('/goede-doelen');
  revalidatePath('/beheer');
  revalidatePath('/');
  if (ronde_id) revalidatePath(`/beheer/ronde/${ronde_id}`);
}

export async function wijzigWinnaar(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  const naam = str(fd, 'naam');
  const experience_titel = str(fd, 'experience_titel');
  const maand = str(fd, 'maand');
  if (!id || !naam || !experience_titel || !maand) return;

  const sb = serviceClient();

  const update: Record<string, unknown> = {
    naam,
    experience_titel,
    maand,
    toelichting: str(fd, 'toelichting') || null,
    opbrengst: Number(str(fd, 'opbrengst')) || 0,
  };

  const foto = fd.get('foto');
  if (foto instanceof File && foto.size > 0) {
    const ext = foto.name.split('.').pop()?.toLowerCase() || 'jpg';
    const pad = `winnaars/${maand}-${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await foto.arrayBuffer());
    const { error: upErr } = await sb.storage
      .from('fotos')
      .upload(pad, bytes, { contentType: foto.type || 'image/jpeg', upsert: true });
    if (!upErr) {
      update.foto_url = sb.storage.from('fotos').getPublicUrl(pad).data.publicUrl;
    }
  }

  await sb.from('winnaars').update(update).eq('id', id);
  revalidatePath('/beheer');
  revalidatePath(`/beheer/winnaar/${id}`);
  revalidatePath('/');
  revalidatePath('/goede-doelen');
}

/** Werkt alleen de weekopbrengst van één winnaar bij (snel bewerken vanaf het overzicht). */
export async function zetWeekOpbrengst(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  if (!id) return;
  await serviceClient()
    .from('winnaars')
    .update({ opbrengst: Number(str(fd, 'opbrengst')) || 0 })
    .eq('id', id);
  revalidatePath('/beheer');
  revalidatePath('/goede-doelen');
  revalidatePath('/');
}

export async function zetWinnaarPublicatie(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  const gepubliceerd = str(fd, 'gepubliceerd') === 'true';
  if (!id) return;
  await serviceClient().from('winnaars').update({ gepubliceerd }).eq('id', id);
  revalidatePath('/beheer');
  revalidatePath('/');
}

export async function verwijderWinnaar(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  if (!id) return;
  await serviceClient().from('winnaars').delete().eq('id', id);
  revalidatePath('/beheer');
  revalidatePath('/');
}

// ---------- Goede doelen ----------
export async function maakDoel(fd: FormData) {
  await assertAdmin();
  const naam = str(fd, 'naam');
  if (!naam) return;
  await serviceClient().from('doelen').insert({
    naam,
    omschrijving: str(fd, 'omschrijving') || null,
    jaar: Number(str(fd, 'jaar')) || null,
    maand: str(fd, 'maand') || null,
  });
  revalidatePath('/beheer');
  revalidatePath('/goede-doelen');
  revalidatePath('/');
}

export async function wijzigDoel(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  if (!id) return;
  await serviceClient()
    .from('doelen')
    .update({
      naam: str(fd, 'naam'),
      omschrijving: str(fd, 'omschrijving') || null,
      jaar: Number(str(fd, 'jaar')) || null,
      maand: str(fd, 'maand') || null,
    })
    .eq('id', id);
  revalidatePath('/beheer');
  revalidatePath('/goede-doelen');
  revalidatePath('/');
}

export async function verwijderDoel(fd: FormData) {
  await assertAdmin();
  const id = str(fd, 'id');
  if (!id) return;
  await serviceClient().from('doelen').delete().eq('id', id);
  revalidatePath('/beheer');
  revalidatePath('/goede-doelen');
  revalidatePath('/');
}
