import { ImageResponse } from 'next/og';
import { AppIcon } from '@/lib/appIcon';

// Favicon / browsertab-icoon (en bron voor de manifest-iconen).
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<AppIcon size={512} />, { ...size });
}
