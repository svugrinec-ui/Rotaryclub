import { cijferTekst } from '@/lib/cijferReveal';

interface Props {
  nummer: number | null;
  /** Hoeveel cijfers er al onthuld zijn (0 = nog niets). */
  zichtbaar: number;
}

/**
 * Het lotnummer met de nog onbekende cijfers als bolletjes. Elk cijfer dat
 * erbij komt springt even op, zodat de zaal het kan meelezen.
 */
export default function CijferNummer({ nummer, zichtbaar }: Props) {
  const tekst = cijferTekst(nummer, zichtbaar);
  return (
    <>
      <span aria-hidden>#</span>
      {tekst.split('').map((teken, i) => (
        <span
          key={i}
          className={`cijfer${teken === '•' ? ' leeg' : ''}${
            i === zichtbaar - 1 ? ' nieuw' : ''
          }`}
        >
          {teken}
        </span>
      ))}
    </>
  );
}
