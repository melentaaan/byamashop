import { useCallback, useEffect, useRef, useState } from 'react';
import type { Catalog } from '../backend/types';
import type { ProductWithRelations } from '../lib/types';
import { Icon } from './Icon';
import { ProductCard } from './ProductCard';

/** Carrousel horizontal (défilement natif + aimantation), flèches sur ordinateur. */
export function ProductRail({ products, catalog, label }: { products: ProductWithRelations[]; catalog: Catalog; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [update, products.length]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
  };

  const scrollable = !(edges.start && edges.end);
  return (
    <div className="rail">
      <div className="rail-track" ref={track} role="list" aria-label={label}>
        {products.map((p, i) => (
          <div role="listitem" className="rail-item" key={p.id} style={{ ['--i' as string]: Math.min(i, 5) }}>
            <ProductCard product={p} catalog={catalog} />
          </div>
        ))}
      </div>
      {scrollable && (
        <div className="rail-nav hide-mobile">
          <button type="button" className="rail-btn" onClick={() => go(-1)} disabled={edges.start} aria-label={`${label} : produits précédents`}><Icon name="chevron-left" /></button>
          <button type="button" className="rail-btn" onClick={() => go(1)} disabled={edges.end} aria-label={`${label} : produits suivants`}><Icon name="chevron-right" /></button>
        </div>
      )}
    </div>
  );
}
