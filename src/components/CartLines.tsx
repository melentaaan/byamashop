import { Link } from 'react-router';
import { cart } from '../lib/cart';
import { formatFCFA } from '../lib/format';
import { variantLabel, type ResolvedCartLine } from '../hooks/useCatalog';
import { Icon } from './Icon';
import { ProductThumb } from './ProductImage';
import { QtyInput } from './QtyInput';

export function CartLines({ lines, onNavigate, compact }: { lines: ResolvedCartLine[]; onNavigate?: () => void; compact?: boolean }) {
  return (
    <ul className={`cart-lines ${compact ? 'cart-lines--compact' : ''}`} data-testid="cart-lines">
      {lines.map((l) => {
        const name = l.product?.name ?? 'Article indisponible';
        const label = l.product && l.variant ? variantLabel(l.product, l.variant) : '';
        return (
          <li key={l.variantId} className={`cart-line ${l.issue === 'unavailable' ? 'is-unavailable' : ''}`} data-testid="cart-line">
            {l.product ? (
              <Link to={`/produit/${l.product.slug}`} onClick={onNavigate} className="cart-line-media" tabIndex={-1} aria-hidden="true">
                <ProductThumb product={l.product} size={compact ? 72 : 88} />
              </Link>
            ) : <span className="cart-line-media"><span className="thumb" style={{ width: 72, height: 90 }} /></span>}
            <div className="cart-line-info">
              {l.product ? <Link to={`/produit/${l.product.slug}`} onClick={onNavigate} className="cart-line-name">{name}</Link> : <span className="cart-line-name">{name}</span>}
              {label && <span className="cart-line-variant">{label}</span>}
              {l.issue === 'unavailable' && <span className="cart-line-issue">Cet article n’est plus disponible. Retirez-le pour continuer.</span>}
              {l.issue === 'insufficient' && <span className="cart-line-issue">Plus que {l.available} en stock : ajustez la quantité.</span>}
              <div className="cart-line-actions">
                {l.issue !== 'unavailable' && (
                  <QtyInput small value={l.quantity} max={Math.max(1, Math.min(99, l.available))} onChange={(q) => cart.setQuantity(l.variantId, q)} label={`Quantité pour ${name}`} />
                )}
                <button type="button" className="cart-line-remove" onClick={() => cart.remove(l.variantId)} aria-label={`Retirer ${name} du panier`}>
                  <Icon name="trash" size={18} /> <span>Retirer</span>
                </button>
              </div>
            </div>
            <div className="cart-line-price">
              {l.issue !== 'unavailable' && <>
                <strong>{formatFCFA(l.lineTotal)}</strong>
                {l.quantity > 1 && <span className="small muted">{formatFCFA(l.unitPrice)} / unité</span>}
              </>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
