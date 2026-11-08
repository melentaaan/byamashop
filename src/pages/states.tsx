import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';

export function ErrorState({ onRetry, title = 'Impossible de charger la boutique' }: { onRetry?: () => void; title?: string }) {
  return (
    <div className="container empty-state" role="alert">
      <span className="es-icon"><Icon name="alert" /></span>
      <h1>{title}</h1>
      <p>La connexion semble interrompue ou le service est momentanément indisponible. Vérifiez votre connexion puis réessayez.</p>
      {onRetry && <button className="btn btn--primary" onClick={onRetry}><Icon name="refresh" size={18} /> Réessayer</button>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="container section" aria-busy="true" aria-label="Chargement">
      <div className="skeleton" style={{ height: 28, width: 220 }} />
      <div className="skeleton" style={{ height: 320, marginTop: 24 }} />
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="container empty-state">
      <Seo title="Page introuvable" noindex />
      <span className="es-icon"><Icon name="search" /></span>
      <h1>Cette page est introuvable</h1>
      <p>Le lien est peut-être incomplet ou le produit n’est plus en ligne. Continuez vos achats depuis la boutique.</p>
      <div className="cluster" style={{ justifyContent: 'center' }}>
        <Link to="/boutique" className="btn btn--primary">Voir la boutique</Link>
        <Link to="/" className="btn btn--secondary">Accueil</Link>
      </div>
    </div>
  );
}
