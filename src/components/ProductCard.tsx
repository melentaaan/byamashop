import { Link } from 'react-router';
import type { Catalog } from '../backend/types';
import { productFromPrice, totalStock } from '../hooks/useCatalog';
import { cart, favoritesStore, toggleFavorite } from '../lib/cart';
import { formatFCFA } from '../lib/format';
import type { ProductWithRelations } from '../lib/types';
import { Icon } from './Icon';
import { ProductImg } from './ProductImage';
import { useUi } from './ui';

export function Price({ price, compareAt, from }: { price: number; compareAt: number | null; from?: boolean }) {
  return (
    <span className={`price ${compareAt ? 'price--sale' : ''}`}>
      {from && <span className="price-from">dès</span>}
      <span className="price-now">{formatFCFA(price)}</span>
      {compareAt && <span className="price-compare"><span className="sr-only">au lieu de </span>{formatFCFA(compareAt)}</span>}
    </span>
  );
}

export function FavoriteButton({ product, className = '' }: { product: ProductWithRelations; className?: string }) {
  const favs = favoritesStore.use();
  const on = favs.includes(product.id);
  const { toast } = useUi();
  return (
    <button
      type="button"
      className={`fav-btn ${on ? 'is-on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
      onClick={(e) => {
        e.preventDefault();
        toggleFavorite(product.id);
        toast(on ? 'Retiré des favoris' : 'Ajouté aux favoris', on ? undefined : { action: { label: 'Voir', to: '/favoris' } });
      }}
    >
      <Icon name="heart" fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function ProductCard({ product, catalog, eager }: { product: ProductWithRelations; catalog: Catalog; eager?: boolean }) {
  const price = productFromPrice(catalog, product);
  const stock = totalStock(product);
  const category = catalog.categories.find((c) => c.id === product.category_id);
  const activeVariants = product.variants.filter((v) => v.is_active);
  const single = activeVariants.length === 1 ? activeVariants[0] : null;
  const colors = [...new Map(activeVariants.filter((v) => v.option2).map((v) => [v.option2, v.color_hex])).entries()];
  const { toast, openCart } = useUi();
  const [img1, img2] = product.images;

  return (
    <article className={`product-card ${stock === 0 ? 'is-soldout' : ''}`} data-testid="product-card">
      <div className="pc-media">
        <Link to={`/produit/${product.slug}`} className="pc-media-link" aria-label={product.name} tabIndex={-1}>
          <ProductImg image={img1} eager={eager} className="pc-img" alt="" />
          {img2 && <ProductImg image={img2} className="pc-img pc-img--alt" alt="" />}
        </Link>
        <div className="pc-badges">
          {stock === 0 ? <span className="badge badge--soldout">Épuisé</span>
            : price.percentOff > 0 ? <span className="badge badge--sale">−{price.percentOff} %</span>
            : product.is_new ? <span className="badge badge--new">Nouveau</span> : null}
          {product.condition_note && stock > 0 && <span className="badge badge--muted">Seconde main</span>}
        </div>
        <FavoriteButton product={product} className="pc-fav" />
        {stock > 0 && (
          single ? (
            <button
              type="button" className="pc-quick"
              onClick={() => { cart.add(product.id, single.id, 1, single.stock); toast('Ajouté au panier', { action: { label: 'Voir le panier', to: '/panier' } }); openCart(); }}
            >
              <Icon name="plus" size={18} /> Ajouter
            </button>
          ) : (
            <Link to={`/produit/${product.slug}`} className="pc-quick" tabIndex={-1}><Icon name="sliders" size={18} /> Choisir une option</Link>
          )
        )}
      </div>
      <div className="pc-body">
        {category && <p className="pc-cat">{category.name}</p>}
        <h3 className="pc-name"><Link to={`/produit/${product.slug}`}>{product.name}</Link></h3>
        <div className="pc-meta">
          <Price price={price.price} compareAt={price.compareAt} from={price.varies} />
          {colors.length > 1 && (
            <span className="pc-swatches" aria-label={`${colors.length} couleurs`}>
              {colors.slice(0, 4).map(([name, hex]) => <span key={name} className="swatch-dot" style={{ background: hex ?? '#ddd' }} title={name ?? ''} />)}
            </span>
          )}
        </div>
        {stock > 0 && stock <= 2 && <p className="pc-stock">Plus que {stock} disponible{stock > 1 ? 's' : ''}</p>}
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Chargement des produits">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="product-card">
          <div className="skeleton" style={{ aspectRatio: '4 / 5' }} />
          <div className="skeleton" style={{ height: 14, width: '40%', marginTop: 14 }} />
          <div className="skeleton" style={{ height: 18, width: '80%', marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
