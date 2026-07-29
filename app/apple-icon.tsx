import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppIcon } from '@/lib/appIcon';

// iPhone-tegel ("Zet op beginscherm") gebruikt dit icoon.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Het Rotary-wiel uit public/ (transparant) als data-URI; ontbreekt het, dan
// valt AppIcon terug op het getekende tandwiel.
function wheelSrc(): string | undefined {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'RotaryMoE-R_CMYK-C.png'));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}

export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={180} wheelSrc={wheelSrc()} />, { ...size });
}
