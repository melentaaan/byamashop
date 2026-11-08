import { Link } from 'react-router';
import { CartLines } from '../components/CartLines';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { useCatalog, useCart } from '../hooks/useCatalog';
import { cart } from '../lib/cart';
import { formatFCFA } from '../lib/format';
import { PageLoader } from './states';

export default function CartPage() {
  const { data, isLoading } = useCatalog();
  const { lines, subtotal, count, hasIssues } = useCart();
  if (isLoading && !data) return <PageLoader />;
  const zones = data?.zones.filter((z) => !z.is_pickup) ?? [];
  const minFee = zones.length ? Math.min(...zones.map((z) => z.fee)) : null;
  return (
    <div className="container section--tight">
      <Seo title="Mon panier" path="/panier" noindex />
      <h1 className="page-title">Mon panier</h1>
      {lines.length === 0 ? (
        <div className="empty-state">
          <span className="es-icon"><Icon name="bag" /></span>
          <h2>Votre panier est vide</h2>
          <p>Votre panier est conservé sur cet appareil : ajoutez des articles quand vous le souhaitez.</p>
          <Link to="/boutique" className="btn btn--primary">Découvrir la boutique</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            <CartLines lines={lines} />
            <button className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm('Vider entièrement le panier ?')) cart.clear(); }}>
              <Icon name="trash" size={16} /> Vider le panier
            </button>
          </div>
          <aside className="summary-card" aria-label="Récapitulatif">
            <h2>Récapitulatif</h2>
            <div className="summary-row"><span>Articles ({count})</span><span>{formatFCFA(subtotal)}</span></div>
            <div className="summary-row"><span>Livraison</span><span className="muted">{minFee != null ? `dès ${formatFCFA(minFee)}` : 'à l’étape suivante'}</span></div>
            <div className="summary-row summary-row--total"><span>Sous-total</span><strong data-testid="cart-subtotal">{formatFCFA(subtotal)}</strong></div>
            {hasIssues && <p className="alert alert--warning"><Icon name="alert" /> Certains articles ne sont plus disponibles en quantité suffisante. Ajustez votre panier pour continuer.</p>}
            {hasIssues
              ? <button className="btn btn--primary btn--lg btn--block" disabled>Passer la commande</button>
              : <Link to="/commande" className="btn btn--primary btn--lg btn--block" data-testid="go-checkout">Passer la commande</Link>}
            <Link to="/boutique" className="btn btn--ghost btn--block">Continuer mes achats</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
