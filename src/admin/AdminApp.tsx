import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router';
import { backend } from '../backend';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { isDemoMode } from '../lib/config';
import { PageLoader } from '../pages/states';
import { LoginPage, UpdatePasswordPage } from './Login';
import '../styles/admin.css';

const Dashboard = lazy(() => import('./Dashboard'));
const Products = lazy(() => import('./Products'));
const ProductEditor = lazy(() => import('./ProductEditor'));
const Orders = lazy(() => import('./Orders'));
const OrderDetail = lazy(() => import('./OrderDetail'));
const CatalogAdmin = lazy(() => import('./CatalogAdmin'));
const SettingsAdmin = lazy(() => import('./SettingsAdmin'));
const Messages = lazy(() => import('./Messages'));
const ImportProducts = lazy(() => import('./ImportProducts'));

export function useAdminUser() {
  const qc = useQueryClient();
  useEffect(() => backend.onAuthChange(() => qc.invalidateQueries({ queryKey: ['admin-user'] })), [qc]);
  return useQuery({ queryKey: ['admin-user'], queryFn: () => backend.getCurrentUser(), staleTime: 30_000 });
}

const NAV = [
  { to: '/admin', label: 'Tableau de bord', icon: 'chart', end: true },
  { to: '/admin/commandes', label: 'Commandes', icon: 'package' },
  { to: '/admin/produits', label: 'Produits & stock', icon: 'tag' },
  { to: '/admin/catalogue', label: 'Catégories & promos', icon: 'layers' },
  { to: '/admin/messages', label: 'Messages', icon: 'inbox' },
  { to: '/admin/reglages', label: 'Réglages boutique', icon: 'settings' },
];

function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const qc = useQueryClient();
  useEffect(() => setOpen(false), [location.pathname]);
  const logout = async () => {
    await backend.signOut();
    qc.clear();
  };
  return (
    <div className="admin">
      <Seo title="Administration" noindex />
      <header className="admin-topbar">
        <button className="icon-btn admin-menu-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-nav" aria-label="Menu d’administration"><Icon name="menu" /></button>
        <Link to="/admin" className="admin-brand"><img src="/brand/logo.svg" alt="Byamashop" width={478} height={140} /><span>Gestion</span></Link>
        <div className="admin-topbar-actions">
          <a href="/" target="_blank" rel="noopener" className="btn btn--ghost btn--sm"><Icon name="external" size={16} /> <span className="hide-mobile">Voir la boutique</span></a>
        </div>
      </header>
      {isDemoMode && <div className="admin-demo">Mode démonstration : les données sont enregistrées uniquement dans ce navigateur.</div>}
      <div className="admin-body">
        <nav id="admin-nav" className={`admin-nav ${open ? 'is-open' : ''}`} aria-label="Administration">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}><NavLink to={n.to} end={n.end}><Icon name={n.icon} size={20} /> {n.label}</NavLink></li>
            ))}
          </ul>
          <div className="admin-nav-foot">
            <p className="small muted">{email}</p>
            <Link to="/admin/mot-de-passe" className="small">Changer mon mot de passe</Link>
            <button className="btn btn--soft btn--sm" onClick={logout}><Icon name="logout" size={16} /> Se déconnecter</button>
          </div>
        </nav>
        <main className="admin-main" id="contenu">{children}</main>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { data: user, isLoading } = useAdminUser();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (location.pathname.startsWith('/admin/mot-de-passe') && user) {
    return <Shell email={user.email}><UpdatePasswordPage /></Shell>;
  }
  if (!user || !user.isAdmin) return <LoginPage notAdmin={!!user && !user.isAdmin} />;
  return (
    <Shell email={user.email}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="produits" element={<Products />} />
          <Route path="produits/nouveau" element={<ProductEditor />} />
          <Route path="produits/import" element={<ImportProducts />} />
          <Route path="produits/:id" element={<ProductEditor />} />
          <Route path="commandes" element={<Orders />} />
          <Route path="commandes/:id" element={<OrderDetail />} />
          <Route path="catalogue" element={<CatalogAdmin />} />
          <Route path="messages" element={<Messages />} />
          <Route path="reglages" element={<SettingsAdmin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}
