import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';

interface Toast { id: number; message: string; tone: 'default' | 'error'; action?: { label: string; to: string } }
interface UiState {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toast: (message: string, opts?: { tone?: Toast['tone']; action?: Toast['action'] }) => void;
}

const UiContext = createContext<UiState | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const toast = useCallback<UiState['toast']>((message, opts) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone: opts?.tone ?? 'default', action: opts?.action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  const value = useMemo(() => ({ cartOpen, openCart: () => setCartOpen(true), closeCart: () => setCartOpen(false), toast }), [cartOpen, toast]);
  return (
    <UiContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'error' ? 'toast--error' : ''}`}>
            <span>{t.message}</span>
            {t.action && <Link to={t.action.to} onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>{t.action.label}</Link>}
          </div>
        ))}
      </div>
    </UiContext.Provider>
  );
}

export function useUi(): UiState {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('UiProvider manquant');
  return ctx;
}

/** Verrouille le défilement + gère Échap + piège le focus dans un panneau modal. */
export function useModal(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.classList.add('is-locked');
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
    window.setTimeout(() => (panel?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? panel)?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab' && panel) {
        const els = focusables();
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('is-locked');
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panelRef]);
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
