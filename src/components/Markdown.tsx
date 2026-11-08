import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * Rendu Markdown minimal et sûr (aucun HTML brut n'est interprété) :
 * titres, paragraphes, listes, citations, **gras**, *italique*, [liens](url).
 * Les marqueurs « [À COMPLÉTER : …] » sont surlignés.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\[À COMPLÉTER[^\]]*\])|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[1]) out.push(<mark key={k} className="todo">{m[1]}</mark>);
    else if (m[2]) {
      const href = m[3];
      if (href.startsWith('/')) out.push(<Link key={k} to={href}>{m[2]}</Link>);
      else if (/^(https?:|mailto:|tel:)/.test(href)) out.push(<a key={k} href={href} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
      else out.push(m[2]);
    } else if (m[4]) out.push(<strong key={k}>{inline(m[4], k)}</strong>);
    else if (m[5]) out.push(<em key={k}>{inline(m[5], k)}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, skipFirstHeading = false }: { source: string; skipFirstHeading?: boolean }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let skipped = !skipFirstHeading;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const k = `b${i}`;
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      if (!skipped && h[1] === '#') { skipped = true; i++; continue; }
      const level = h[1].length;
      const content = inline(h[2], k);
      blocks.push(level === 1 ? <h1 key={k}>{content}</h1> : level === 2 ? <h2 key={k}>{content}</h2> : <h3 key={k}>{content}</h3>);
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={k}>{inline(buf.join(' '), k)}</blockquote>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        items.push(lines[i].replace(ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/, ''));
        i++;
      }
      const lis = items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>);
      blocks.push(ordered ? <ol key={k}>{lis}</ol> : <ul key={k}>{lis}</ul>);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) buf.push(lines[i++]);
    blocks.push(<p key={k}>{inline(buf.join(' '), k)}</p>);
  }
  return <Fragment>{blocks}</Fragment>;
}
