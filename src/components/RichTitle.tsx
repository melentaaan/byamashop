import { Fragment } from 'react';

/** Titre où les passages entre *astérisques* sont mis en italique d'accent. */
export function RichTitle({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('*') && p.endsWith('*') ? <em key={i} className="accent-italic">{p.slice(1, -1)}</em> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

export const plainTitle = (text: string) => text.replace(/\*/g, '');
