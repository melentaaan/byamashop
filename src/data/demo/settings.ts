import type { DeliveryZone, StoreSettings } from '../../lib/types.ts';
import { demoId } from './ids.ts';

/**
 * Réglages initiaux. Les coordonnées et frais de livraison proviennent du site d'origine
 * (products.js) et doivent être vérifiés par la propriétaire avant le lancement.
 */
export const defaultSettings: StoreSettings = {
  business_name: 'Byamashop',
  tagline: 'Élégance, piété & belles trouvailles',
  announcement: 'Livraison à Dakar et partout au Sénégal · Paiement Wave, Orange Money ou à la livraison',
  whatsapp: '221764091727',
  phone: '+221 76 409 17 27',
  email: '',
  address: 'Dakar, Sénégal',
  opening_hours: '',
  socials: { instagram: '', tiktok: '', facebook: '', snapchat: '' },
  payments: {
    wave: {
      enabled: true,
      account_number: '',
      account_name: '',
      payment_link: '',
      instructions:
        "Envoyez le montant total par Wave en indiquant votre référence de commande. Votre paiement est validé dès que nous l'avons vérifié — vous recevez alors une confirmation.",
    },
    orange_money: {
      enabled: true,
      account_number: '',
      account_name: '',
      payment_link: '',
      instructions:
        "Envoyez le montant total par Orange Money en indiquant votre référence de commande. Votre paiement est validé dès que nous l'avons vérifié — vous recevez alors une confirmation.",
    },
    cash_on_delivery: {
      enabled: true,
      account_number: '',
      account_name: '',
      payment_link: '',
      instructions: 'Vous réglez en espèces au moment de la livraison. Merci de préparer le montant exact si possible.',
    },
  },
  hero: {
    eyebrow: 'Boutique en ligne · Dakar',
    title: 'Élégance, piété & *belles trouvailles*',
    subtitle:
      "Robes et tapis de prière, parfums, ensembles, friperie choisie et produits du Maroc — une sélection soignée, livrée chez vous partout au Sénégal.",
    cta_label: 'Découvrir la boutique',
    cta_href: '/boutique',
    image_url: '/demo/editorial/hero.svg',
  },
  banners: [
    {
      id: 'banner-parfums',
      enabled: true,
      eyebrow: 'L’univers parfum',
      title: 'Ouds, muscs & eaux de parfum',
      text: 'Des notes boisées, ambrées ou florales, en flacon, en huile ou en coffret à offrir.',
      cta_label: 'Découvrir les parfums',
      cta_href: '/categorie/parfums',
      image_url: '/demo/editorial/promo.svg',
    },
  ],
  about:
    "Byamashop est une boutique sénégalaise qui réunit l'essentiel de la vie quotidienne et spirituelle : des robes et tapis de prière, des parfums, une friperie sélectionnée, les ensembles chez Cathy, des produits du Maroc et des articles importés.\n\nNotre ambition : de beaux produits, des prix justes et un service humain, du premier message jusqu'à la livraison.",
  wholesale: {
    enabled: true,
    title: 'Revendeurs & commandes en gros',
    text: 'Vous êtes revendeuse, association ou organisez un événement ? Demandez-nous un devis pour des quantités : tapis, robes de prière, parfums et produits importés.',
  },
  returns_summary: 'Conditions de retour et d’échange détaillées sur notre page dédiée.',
  shipping_summary: 'Dakar et banlieue, régions du Sénégal, ou retrait sur place.',
  newsletter_enabled: true,
  low_stock_threshold: 3,
  legal: { raison_sociale: '', forme_juridique: '', ninea: '', rccm: '', responsable_publication: '' },
  site_url: 'https://byamashop.netlify.app',
};

export const defaultZones: DeliveryZone[] = [
  { name: 'Dakar (centre & banlieue)', description: '', fee: 1500, estimate: '24 h', is_pickup: false },
  { name: 'Pikine / Guédiawaye / Rufisque', description: '', fee: 2000, estimate: '24 à 48 h', is_pickup: false },
  { name: 'Thiès / Mbour', description: '', fee: 3000, estimate: '48 à 72 h', is_pickup: false },
  { name: 'Autres régions', description: 'Expédition par transporteur', fee: 4000, estimate: '48 à 72 h', is_pickup: false },
  { name: 'Retrait sur place', description: 'Nous vous indiquons le lieu de retrait à la confirmation', fee: 0, estimate: 'Sur rendez-vous', is_pickup: true },
].map((z, i) => ({ ...z, id: demoId('zone:' + z.name), free_from: null, is_active: true, sort_order: i }));
