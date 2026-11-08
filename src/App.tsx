import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { StoreLayout } from './components/Layout';
import { UiProvider } from './components/ui';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/Product';
import NotFound, { PageLoader } from './pages/states';

const CartPage = lazy(() => import('./pages/CartPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Content = {
  Legal: lazy(() => import('./pages/ContentPages').then((m) => ({ default: m.LegalPage }))),
  About: lazy(() => import('./pages/ContentPages').then((m) => ({ default: m.AboutPage }))),
  Contact: lazy(() => import('./pages/ContentPages').then((m) => ({ default: m.ContactPage }))),
  Wholesale: lazy(() => import('./pages/ContentPages').then((m) => ({ default: m.WholesalePage }))),
};
const AdminApp = lazy(() => import('./admin/AdminApp'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const s = (el: React.ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;
const LEGAL = ['livraison', 'retours-et-remboursements', 'conditions-generales-de-vente', 'confidentialite', 'mentions-legales'];

const router = createBrowserRouter([
  {
    element: <UiProvider><Outlet /></UiProvider>,
    children: [
  {
    element: <StoreLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'boutique', element: <Catalog kind="all" /> },
      { path: 'categorie/:slug', element: <Catalog kind="category" /> },
      { path: 'collections/:slug', element: <Catalog kind="collection" /> },
      { path: 'produit/:slug', element: <ProductPage /> },
      { path: 'panier', element: s(<CartPage />) },
      { path: 'commande', element: s(<Checkout />) },
      { path: 'commande/confirmation/:reference', element: s(<OrderConfirmation />) },
      { path: 'favoris', element: s(<Favorites />) },
      { path: 'a-propos', element: s(<Content.About />) },
      { path: 'contact', element: s(<Content.Contact />) },
      { path: 'revendeurs', element: s(<Content.Wholesale />) },
      ...LEGAL.map((slug) => ({ path: slug, element: s(<Content.Legal slug={slug} key={slug} />) })),
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: 'admin/*', element: s(<AdminApp />) },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
