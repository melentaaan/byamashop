import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { ProductCard, ProductGridSkeleton } from '../components/ProductCard';
import { Seo } from '../components/Seo';
import { useCatalog } from '../hooks/useCatalog';
import { favoritesStore } from '../lib/cart';

export default function Favorites() {
  const ids = favoritesStore.use();
  const { data, isLoading } = useCatalog();
  const products = data ? ids.map((id) => data.products.find((p) => p.id === id)).filter((p) => !!p) : [];
  return (
    <div className="container section--tight">
      <Seo title="Mes favoris" path="/favoris" noindex />
      <h1 className="page-title">Mes favoris</h1>
      {isLoading ? <ProductGridSkeleton count={4} /> : products.length === 0 ? (
        <div className="empty-state">
          <span className="es-icon"><Icon name="heart" /></span>
          <h2>Aucun favori pour le moment</h2>
          <p>Touchez le cœur sur un produit pour le retrouver ici. Vos favoris sont enregistrés sur cet appareil.</p>
          <Link to="/boutique" className="btn btn--primary">Parcourir la boutique</Link>
        </div>
      ) : (
        <div className="product-grid">{products.map((p) => <ProductCard key={p!.id} product={p!} catalog={data!} />)}</div>
      )}
    </div>
  );
}
