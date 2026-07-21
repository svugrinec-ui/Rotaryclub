import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'rotary_admin';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dagen

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET ontbreekt of is te kort.');
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

/** Maakt een ondertekend sessietoken met uitgiftetijdstip. */
export function createSessionToken(): string {
  const payload = `admin.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

/** Controleert een sessietoken (handtekening + leeftijd), tijd-constant. */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false;
  }
  const issued = Number(payload.split('.')[1]);
  if (!Number.isFinite(issued)) return false;
  return Date.now() - issued < MAX_AGE_SECONDS * 1000;
}

/** Verifieert de wachtwoordinvoer tegen ADMIN_PASSWORD (tijd-constant). */
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};

/** Leest de admin-cookie server-side en zegt of de commissie is ingelogd. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}
