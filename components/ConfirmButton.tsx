'use client';

interface Props {
  message: string;
  className?: string;
  children: React.ReactNode;
}

/** Submit-knop die eerst om bevestiging vraagt (voor onomkeerbare acties). */
export default function ConfirmButton({ message, className, children }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
