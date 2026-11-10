import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from 'react';

let observer: IntersectionObserver | null = null;
function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            observer?.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
  }
  return observer;
}

/**
 * Apparition douce au défilement (fondu + léger glissement).
 * Sans IntersectionObserver ou avec « réduire les animations », le contenu est simplement affiché.
 * L'élément ne change jamais de taille : aucun décalage de mise en page.
 */
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, style, ...rest }: {
  as?: ElementType; className?: string; delay?: number; children: ReactNode; style?: CSSProperties; id?: string; 'aria-labelledby'?: string; 'aria-label'?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const io = getObserver();
    if (reduce || !io) { el.classList.add('is-in'); return; }
    io.observe(el);
    return () => io.unobserve(el);
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={delay ? { ...style, ['--reveal-delay' as string]: `${delay}ms` } : style} {...rest}>
      {children}
    </Tag>
  );
}
