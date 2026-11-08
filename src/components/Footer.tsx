import { Link } from 'react-router';
import { useCatalog } from '../hooks/useCatalog';
import { waLink } from '../lib/whatsapp';
import { Icon, WhatsAppIcon } from './Icon';
import { Logo } from './Layout';
import { NewsletterForm } from './NewsletterForm';

export function Footer() {
  const { data } = useCatalog();
  const s = data?.settings;
  const socials = s ? (Object.entries(s.socials) as [string, string][]).filter(([, url]) => /^https?:\/\//.test(url)) : [];
  const socialLabel: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', snapchat: 'Snapchat' };
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo white className="footer-logo" />
          <p>{s?.tagline}</p>
          {s?.newsletter_enabled && (
            <div className="footer-newsletter">
              <p className="footer-title">Restez informée</p>
              <p className="small">Nouveautés et offres, sans excès. Désinscription à tout moment.</p>
              <NewsletterForm dark />
            </div>
          )}
        </div>
        <nav aria-label="Catégories">
          <p className="footer-title">Boutique</p>
          <ul>
            {data?.categories.map((c) => <li key={c.id}><Link to={`/categorie/${c.slug}`}>{c.name}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Aide">
          <p className="footer-title">Aide</p>
          <ul>
            <li><Link to="/livraison">Livraison</Link></li>
            <li><Link to="/retours-et-remboursements">Retours & remboursements</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/revendeurs">Revendeurs & gros</Link></li>
            <li><Link to="/a-propos">À propos</Link></li>
          </ul>
        </nav>
        <div>
          <p className="footer-title">Nous joindre</p>
          <ul className="footer-contact">
            {s?.whatsapp && <li><a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18} /> WhatsApp</a></li>}
            {s?.phone && <li><a href={`tel:${s.phone.replace(/\s/g, '')}`}><Icon name="phone" size={18} /> {s.phone}</a></li>}
            {s?.email && <li><a href={`mailto:${s.email}`}><Icon name="mail" size={18} /> {s.email}</a></li>}
            {s?.address && <li><span><Icon name="pin" size={18} /> {s.address}</span></li>}
          </ul>
          {socials.length > 0 && (
            <ul className="footer-socials" aria-label="Réseaux sociaux">
              {socials.map(([k, url]) => (
                <li key={k}><a href={url} target="_blank" rel="noopener noreferrer" aria-label={socialLabel[k]}><Icon name={k} size={20} /></a></li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} {s?.business_name ?? 'Byamashop'} · Prix en francs CFA (FCFA)</p>
        <ul>
          <li><Link to="/conditions-generales-de-vente">CGV</Link></li>
          <li><Link to="/confidentialite">Confidentialité</Link></li>
          <li><Link to="/mentions-legales">Mentions légales</Link></li>
        </ul>
      </div>
    </footer>
  );
}
