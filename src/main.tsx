import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/plus-jakarta-sans/index.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import App from './App';
import { isDemoMode } from './lib/config';

// Une démonstration (produits fictifs) ne doit pas être indexée par les moteurs de recherche.
if (isDemoMode) {
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('[byamashop] erreur non gérée', e.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
