import { useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../hooks/useCatalog';
import { formatFCFA } from '../lib/format';
import { CartLines } from './CartLines';
import { Icon } from './Icon';
import { useModal, useUi } from './ui';

export function CartDrawer() {
  const { cartOpen, closeCart } = useUi();
  const panel = useRef<HTMLDivElement>(null);
  useModal(cartOpen, closeCart, panel);
  const { lines, subtotal, count, hasIssues } = useCart();
  const navigate = useNavigate();
  if (!cartOpen) return null;
  return (
    <>
      <div className="backdrop" onClick={closeCart} />
      <div className="drawer drawer--right" role="dialog" aria-modal="true" aria-labelledby="cart-title" ref={panel} tabIndex={-1} data-testid="cart-drawer">
        <div className="drawer-head">
          <h2 id="cart-title">Mon panier {count > 0 && <span className="muted small">({count})</span>}</h2>
          <button className="icon-btn" onClick={closeCart} aria-label="Fermer le panier"><Icon name="x" /></button>
        </div>
        {lines.length === 0 ? (
          <div className="drawer-body">
            <div className="empty-state">
              <span className="es-icon"><Icon name="bag" /></span>
              <h2>Votre panier est vide</h2>
              <p>Parcourez nos catégories et ajoutez vos coups de cœur.</p>
              <Link to="/boutique" className="btn btn--primary" onClick={closeCart}>Découvrir la boutique</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body"><CartLines lines={lines} onNavigate={closeCart} compact /></div>
            <div className="drawer-foot">
              <div className="summary-row summary-row--total"><span>Sous-total</span><strong data-testid="drawer-subtotal">{formatFCFA(subtotal)}</strong></div>
              <p className="small muted">Frais de livraison calculés à l’étape suivante selon votre zone.</p>
              <button className="btn btn--primary btn--lg btn--block" disabled={hasIssues} onClick={() => { closeCart(); navigate('/commande'); }}>
                Passer la commande
              </button>
              <Link to="/panier" className="btn btn--ghost btn--block" onClick={closeCart}>Voir le panier</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
