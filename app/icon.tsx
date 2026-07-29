import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppIcon } from '@/lib/appIcon';

// Favicon / browsertab-icoon (en bron voor de manifest-iconen).
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

function wheelSrc(): string | undefined {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'RotaryMoE-R_CMYK-C.png'));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}

export default function Icon() {
  return new ImageResponse(<AppIcon size={512} wheelSrc={wheelSrc()} />, { ...size });
}
