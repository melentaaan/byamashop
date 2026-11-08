import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useCatalog, useCart } from '../hooks/useCatalog';
import { favoritesStore } from '../lib/cart';
import { isDemoMode } from '../lib/config';
import { waLink } from '../lib/whatsapp';
import { defaultSettings } from '../data/demo/settings';
import { Icon, WhatsAppIcon } from './Icon';
import { SearchBox } from './SearchBox';
import { CartDrawer } from './CartDrawer';
import { useModal, useUi } from './ui';
import { Footer } from './Footer';

export function Logo({ className, white }: { className?: string; white?: boolean }) {
  return (
    <img
      className={className}
      src={white ? '/brand/logo-white.svg' : '/brand/logo.svg'}
      alt="Byamashop"
      width={531}
      height={140}
    />
  );
}

function CartButton() {
  const { count } = useCart();
  const { openCart } = useUi();
  const [bump, setBump] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) { setBump(true); const t = setTimeout(() => setBump(false), 400); prev.current = count; return () => clearTimeout(t); }
    prev.current = count;
  }, [count]);
  return (
    <button type="button" className="icon-btn" onClick={openCart} aria-label={`Ouvrir le panier (${count} article${count > 1 ? 's' : ''})`} data-testid="cart-button">
      <Icon name="bag" />
      {count > 0 && <span className={`count-dot ${bump ? 'bump' : ''}`} data-testid="cart-count">{count}</span>}
    </button>
  );
}

function FavoritesLink() {
  const favs = favoritesStore.use();
  return (
    <Link to="/favoris" className="icon-btn hide-mobile" aria-label={`Mes favoris (${favs.length})`}>
      <Icon name="heart" />
      {favs.length > 0 && <span className="count-dot">{favs.length}</span>}
    </Link>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useModal(open, onClose, panel);
  const { data } = useCatalog();
  if (!open) return null;
  const s = data?.settings;
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="drawer drawer--left mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" ref={panel} tabIndex={-1} id="mobile-menu">
        <div className="drawer-head">
          <Logo className="mobile-menu-logo" />
          <button className="icon-btn" onClick={onClose} aria-label="Fermer le menu"><Icon name="x" /></button>
        </div>
        <div className="drawer-body">
          <SearchBox variant="panel" onDone={onClose} />
          <nav aria-label="Catégories" className="mm-section">
            <p className="eyebrow eyebrow--plain">Catégories</p>
            <ul className="mm-cats">
              {data?.categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/categorie/${c.slug}`} onClick={onClose}>
                    {c.image_url && <img src={c.image_url} alt="" width={44} height={55} loading="lazy" />}
                    <span>{c.name}</span>
                    <Icon name="chevron-right" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Liens utiles" className="mm-section mm-links">
            <Link to="/boutique" onClick={onClose}>Toute la boutique</Link>
            <Link to="/boutique?tri=nouveautes" onClick={onClose}>Nouveautés</Link>
            <Link to="/favoris" onClick={onClose}>Mes favoris</Link>
            <Link to="/revendeurs" onClick={onClose}>Revendeurs & commandes en gros</Link>
            <Link to="/livraison" onClick={onClose}>Livraison</Link>
            <Link to="/a-propos" onClick={onClose}>À propos</Link>
            <Link to="/contact" onClick={onClose}>Contact</Link>
          </nav>
          {s?.whatsapp && (
            <a className="btn btn--whatsapp btn--block" href={waLink(s.whatsapp, 'Bonjour Byamashop, j’ai une question.')} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Nous écrire sur WhatsApp
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function Header() {
  const { data } = useCatalog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => { setSearchOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // valeur par défaut tant que les réglages chargent : évite un décalage de mise en page
  const announcement = data ? data.settings.announcement : defaultSettings.announcement;
  return (
    <>
      {isDemoMode && (
        <div className="demo-banner" role="note">
          <strong>Site de démonstration</strong>
          <span className="hide-mobile"> — produits et prix fictifs ; les commandes restent dans ce navigateur et ne sont pas transmises à la boutique.</span>
          <span className="show-mobile"> · commandes non transmises</span>
        </div>
      )}
      {announcement && <div className="announcement"><p>{announcement}</p></div>}
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-inner">
          <button className="icon-btn show-mobile" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu" aria-expanded={menuOpen} aria-controls="mobile-menu" data-testid="menu-button">
            <Icon name="menu" />
          </button>
          <Link to="/" className="logo-link" aria-label="Byamashop — accueil"><Logo className="logo" /></Link>
          <nav className="main-nav hide-mobile" aria-label="Navigation principale">
            <div className="nav-item nav-item--dropdown">
              <NavLink to="/boutique" className="nav-link">Boutique <Icon name="chevron-down" size={16} /></NavLink>
              <div className="nav-dropdown">
                <div className="nav-dropdown-inner">
                  <ul>
                    {data?.categories.map((c) => (
                      <li key={c.id}><Link to={`/categorie/${c.slug}`}>{c.name}</Link></li>
                    ))}
                  </ul>
                  <Link to="/boutique" className="link-arrow">Toute la boutique <Icon name="arrow-right" /></Link>
                </div>
              </div>
            </div>
            <NavLink to="/boutique?tri=nouveautes" className="nav-link">Nouveautés</NavLink>
            <NavLink to="/revendeurs" className="nav-link">Revendeurs</NavLink>
            <NavLink to="/a-propos" className="nav-link">À propos</NavLink>
            <NavLink to="/contact" className="nav-link">Contact</NavLink>
          </nav>
          <div className="header-actions">
            <div className="header-search hide-mobile"><SearchBox /></div>
            <button className="icon-btn show-mobile" onClick={() => setSearchOpen((v) => !v)} aria-label="Rechercher" aria-expanded={searchOpen}>
              <Icon name="search" />
            </button>
            <FavoritesLink />
            <CartButton />
          </div>
        </div>
        {searchOpen && (
          <div className="mobile-search show-mobile">
            <div className="container"><SearchBox autoFocus variant="panel" onDone={() => setSearchOpen(false)} /></div>
          </div>
        )}
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function BottomBar() {
  const { count } = useCart();
  const favs = favoritesStore.use();
  const { openCart } = useUi();
  return (
    <nav className="bottom-bar" aria-label="Navigation mobile">
      <NavLink to="/" end><Icon name="home" /><span>Accueil</span></NavLink>
      <NavLink to="/boutique"><Icon name="grid" /><span>Boutique</span></NavLink>
      <NavLink to="/favoris"><span className="bb-icon"><Icon name="heart" />{favs.length > 0 && <span className="count-dot">{favs.length}</span>}</span><span>Favoris</span></NavLink>
      <button type="button" onClick={openCart}><span className="bb-icon"><Icon name="bag" />{count > 0 && <span className="count-dot">{count}</span>}</span><span>Panier</span></button>
    </nav>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function StoreLayout() {
  const { data } = useCatalog();
  const wa = data?.settings.whatsapp;
  return (
    <>
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <ScrollToTop />
      <Header />
      <main id="contenu" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <BottomBar />
      {wa && (
        <a className="wa-float hide-mobile" href={waLink(wa, 'Bonjour Byamashop, j’ai une question.')} target="_blank" rel="noopener noreferrer" aria-label="Nous écrire sur WhatsApp">
          <WhatsAppIcon size={26} />
        </a>
      )}
      <CartDrawer />
    </>
  );
}
