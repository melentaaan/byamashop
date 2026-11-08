import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { backend } from '../backend';
import { ContactForm } from '../components/ContactForm';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { useCatalog } from '../hooks/useCatalog';
import { config } from '../lib/config';
import { formatFCFA } from '../lib/format';
import { fillPlaceholders } from '../lib/settings';
import { waLink } from '../lib/whatsapp';
import NotFound, { ErrorState, PageLoader } from './states';

export function DeliveryTable() {
  const { data } = useCatalog();
  if (!data) return null;
  return (
    <div className="zone-table-wrap">
      <table className="zone-table">
        <caption className="sr-only">Zones et frais de livraison</caption>
        <thead><tr><th scope="col">Zone</th><th scope="col">Délai indicatif</th><th scope="col">Frais</th></tr></thead>
        <tbody>
          {data.zones.map((z) => (
            <tr key={z.id}>
              <th scope="row">{z.name}{z.description && <small>{z.description}</small>}</th>
              <td>{z.estimate || '—'}</td>
              <td>{z.fee ? formatFCFA(z.fee) : 'Gratuit'}{z.free_from ? <small>offerte dès {formatFCFA(z.free_from)}</small> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalPage({ slug }: { slug: string }) {
  const { data: catalog } = useCatalog();
  const q = useQuery({ queryKey: ['page', slug], queryFn: () => backend.getPage(slug) });
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState onRetry={() => q.refetch()} />;
  if (!q.data) return <NotFound />;
  const body = catalog ? fillPlaceholders(q.data.body, catalog.settings, config.siteUrl || catalog.settings.site_url) : q.data.body;
  return (
    <div className="container--narrow section--tight">
      <Seo title={q.data.title} path={`/${slug}`} description={`${q.data.title} — Byamashop`} />
      <nav className="breadcrumbs" aria-label="Fil d’Ariane"><ol><li><Link to="/">Accueil</Link></li><li><span aria-current="page">{q.data.title}</span></li></ol></nav>
      {slug === 'livraison' && (
        <section className="delivery-summary" aria-labelledby="zones-title">
          <h1>{q.data.title}</h1>
          <h2 id="zones-title" className="h-small">Zones et tarifs actuels</h2>
          <DeliveryTable />
        </section>
      )}
      <article className="prose"><Markdown source={body} skipFirstHeading={slug === 'livraison'} /></article>
    </div>
  );
}

export function AboutPage() {
  const { data } = useCatalog();
  if (!data) return <PageLoader />;
  const s = data.settings;
  return (
    <>
      <Seo title="À propos" path="/a-propos" description={s.about.slice(0, 160)} />
      <section className="page-hero">
        <div className="container story">
          <div className="story-media"><img src="/demo/editorial/story.svg" alt="" width={800} height={1000} /></div>
          <div className="story-copy">
            <p className="eyebrow">À propos</p>
            <h1>{s.business_name}, <em className="accent-italic">{s.tagline.toLowerCase()}</em></h1>
            {s.about.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
            <div className="cluster">
              <Link to="/boutique" className="btn btn--primary">Découvrir la boutique</Link>
              <Link to="/contact" className="btn btn--secondary">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section section--tint">
        <div className="container">
          <div className="section-head"><div><p className="eyebrow">Nos univers</p><h2>Ce que vous trouverez chez nous</h2></div></div>
          <ul className="about-cats">
            {data.categories.map((c) => (
              <li key={c.id}><Link to={`/categorie/${c.slug}`}><strong>{c.name}</strong><span>{c.description}</span><Icon name="arrow-right" size={18} /></Link></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export function ContactPage() {
  const { data } = useCatalog();
  const s = data?.settings;
  return (
    <div className="container section--tight">
      <Seo title="Contact" path="/contact" description="Une question sur un produit, une taille ou une commande ? Contactez Byamashop par WhatsApp, téléphone ou via le formulaire." />
      <div className="contact-layout">
        <div>
          <p className="eyebrow">Contact</p>
          <h1>Parlons de votre commande</h1>
          <p className="lead">Une question sur une taille, une couleur, une disponibilité ou une commande en cours ? Nous vous répondons personnellement.</p>
          <ul className="contact-cards">
            {s?.whatsapp && <li><a href={waLink(s.whatsapp, 'Bonjour Byamashop, j’ai une question.')} target="_blank" rel="noopener noreferrer"><span className="cc-icon"><WhatsAppIcon size={22} /></span><span><strong>WhatsApp</strong><small>Le plus rapide</small></span></a></li>}
            {s?.phone && <li><a href={`tel:${s.phone.replace(/\s/g, '')}`}><span className="cc-icon"><Icon name="phone" /></span><span><strong>{s.phone}</strong><small>Appel</small></span></a></li>}
            {s?.email && <li><a href={`mailto:${s.email}`}><span className="cc-icon"><Icon name="mail" /></span><span><strong>{s.email}</strong><small>E-mail</small></span></a></li>}
            {s?.address && <li><span className="cc-static"><span className="cc-icon"><Icon name="pin" /></span><span><strong>{s.address}</strong>{s.opening_hours && <small>{s.opening_hours}</small>}</span></span></li>}
          </ul>
        </div>
        <div className="summary-card">
          <h2>Écrivez-nous</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

export function WholesalePage() {
  const { data } = useCatalog();
  const s = data?.settings;
  return (
    <div className="container section--tight">
      <Seo title="Revendeurs & commandes en gros" path="/revendeurs" description="Revendeuses, associations, événements : demandez un devis Byamashop pour des quantités." />
      <div className="contact-layout">
        <div>
          <p className="eyebrow">Professionnels</p>
          <h1>{s?.wholesale.title ?? 'Revendeurs & commandes en gros'}</h1>
          <p className="lead">{s?.wholesale.text}</p>
          <ul className="check-list">
            <li><Icon name="check" size={18} /> Indiquez les articles et les quantités souhaités</li>
            <li><Icon name="check" size={18} /> Précisez la ville de livraison</li>
            <li><Icon name="check" size={18} /> Nous revenons vers vous avec une proposition</li>
          </ul>
          {s?.whatsapp && <a className="btn btn--whatsapp" href={waLink(s.whatsapp, 'Bonjour Byamashop, je souhaite un devis pour une commande en gros.')} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Demander un devis sur WhatsApp</a>}
        </div>
        <div className="summary-card">
          <h2>Demande de devis</h2>
          <ContactForm defaultSubject="gros" />
        </div>
      </div>
    </div>
  );
}
