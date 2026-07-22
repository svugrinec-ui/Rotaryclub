'use client';

import { IconPrint } from '@/components/Icons';

export default function PrintButton() {
  return (
    <button className="btn" onClick={() => window.print()}>
      <IconPrint size={17} /> Print deze QR-code
    </button>
  );
}
