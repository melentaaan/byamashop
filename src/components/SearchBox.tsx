import { useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCatalog, productFromPrice } from '../hooks/useCatalog';
import { formatFCFA, normalizeText } from '../lib/format';
import { searchProducts } from '../lib/search';
import { Icon } from './Icon';
import { ProductThumb } from './ProductImage';

/** Champ de recherche avec suggestions accessibles (combobox ARIA). */
export function SearchBox({ autoFocus, onDone, variant = 'header' }: { autoFocus?: boolean; onDone?: () => void; variant?: 'header' | 'panel' }) {
  const { data } = useCatalog();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!data || normalizeText(q).length < 2) return [];
    return searchProducts(data, q).slice(0, 6);
  }, [data, q]);

  const go = (path: string) => {
    setOpen(false);
    setQ('');
    onDone?.();
    navigate(path);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && results[active]) return go(`/produit/${results[active].slug}`);
    const term = q.trim();
    go(term ? `/boutique?q=${encodeURIComponent(term)}` : '/boutique');
  };

  return (
    <form role="search" className={`searchbox searchbox--${variant}`} onSubmit={submit} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <label className="sr-only" htmlFor={listId + '-input'}>Rechercher un produit</label>
      <Icon name="search" className="searchbox-icon" />
      <input
        ref={inputRef}
        id={listId + '-input'}
        type="search"
        className="searchbox-input"
        placeholder="Rechercher un produit, une catégorie…"
        autoComplete="off"
        autoFocus={autoFocus}
        value={q}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(results.length - 1, a + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
          if (e.key === 'Escape') { setOpen(false); setActive(-1); }
        }}
        enterKeyHint="search"
      />
      {q && (
        <button type="button" className="searchbox-clear" aria-label="Effacer la recherche" onClick={() => { setQ(''); inputRef.current?.focus(); }}>
          <Icon name="x" size={18} />
        </button>
      )}
      {open && results.length > 0 && data && (
        <ul className="searchbox-results" role="listbox" id={listId} aria-label="Suggestions">
          {results.map((p, i) => {
            const price = productFromPrice(data, p);
            return (
              <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => go(`/produit/${p.slug}`)}>
                  <ProductThumb product={p} size={48} />
                  <span className="sr-name">{p.name}</span>
                  <span className="sr-price">{price.varies ? 'dès ' : ''}{formatFCFA(price.price)}</span>
                </button>
              </li>
            );
          })}
          <li role="option" aria-selected={false} className="searchbox-all">
            <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => go(`/boutique?q=${encodeURIComponent(q.trim())}`)}>
              Voir tous les résultats pour « {q.trim()} » <Icon name="arrow-right" size={16} />
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
