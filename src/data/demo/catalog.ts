/**
 * CATALOGUE DE DÉMONSTRATION
 * --------------------------------------------------------------------------
 * Tous les produits ci-dessous sont fictifs (is_demo = true) : noms, descriptions,
 * prix et stocks sont illustratifs. Les visuels sont des illustrations à remplacer
 * par de vraies photos. Ils peuvent être supprimés en un clic depuis
 * l'administration (Réglages › Catalogue de démonstration).
 */
import type { Category, Collection, Product, ProductImage, ProductVariant, ProductWithRelations } from '../../lib/types';
import { demoId, seededInt } from './ids';

export const DEMO_TIMESTAMP = '2026-11-01T09:00:00.000Z';

const CATEGORY_DEFS: Omit<Category, 'id' | 'image_url' | 'sort_order' | 'is_published'>[] = [
  { slug: 'robes-de-priere', name: 'Robes de prière', description: 'Robes deux pièces, abayas et jilbabs : des coupes amples et des tissus agréables pour prier en toute sérénité.' },
  { slug: 'tapis-de-priere', name: 'Tapis de prière', description: 'Tapis en velours, modèles de voyage, tapis épais confort et coffrets à offrir.' },
  { slug: 'parfums', name: 'Parfums', description: 'Eaux de parfum, huiles parfumées, brumes et thiouraye pour parfumer la maison.' },
  { slug: 'friperie', name: 'Friperie', description: 'Des pièces de seconde main choisies une à une. L’état de chaque article est précisé sur sa fiche.' },
  { slug: 'ensembles-chez-cathy', name: 'Ensembles chez Cathy', description: 'Ensembles en wax, lin et tissus brodés pour femmes et enfants.' },
  { slug: 'produits-du-maroc', name: 'Produits du Maroc', description: 'Savon noir, huile d’argan, ghassoul, caftans et art de la table marocain.' },
  { slug: 'produits-importes', name: 'Produits importés', description: 'Petits équipements pratiques, rangement et accessoires sélectionnés pour le quotidien.' },
  { slug: 'lasalmah', name: 'Lasalmah', description: 'La sélection Lasalmah. Description à compléter par la boutique.' },
];

export const demoCategories: Category[] = CATEGORY_DEFS.map((c, i) => ({
  ...c,
  id: demoId('category:' + c.slug),
  image_url: `/demo/categories/${c.slug}.svg`,
  sort_order: i,
  is_published: true,
}));

const catId = (slug: string) => demoId('category:' + slug);

interface Color { name: string; hex: string }
interface Spec {
  slug: string;
  name: string;
  cat: string;
  price: number;
  compareAt?: number;
  short: string;
  description: string;
  details: string;
  sizes?: string[];
  colors?: Color[];
  option1Name?: string;
  /** Prix par valeur d'option 1 (ex. contenance de parfum) */
  priceBySize?: Record<string, number>;
  featured?: boolean;
  isNew?: boolean;
  condition?: string;
  tags?: string[];
  /** Stock imposé pour toutes les variantes (sinon pseudo-aléatoire 0–14) */
  stock?: number;
  imageAlt: string;
}

const SPECS: Spec[] = [
  // ------------------------------------------------------------------ Robes de prière
  {
    slug: 'robe-priere-deux-pieces-lilas', name: 'Robe de prière deux pièces « Lilas »', cat: 'robes-de-priere',
    price: 12000, compareAt: 15000, featured: true,
    short: 'Voile long et jupe ample, tissu fluide et léger.',
    description: 'Une robe de prière deux pièces pensée pour le confort : un voile long qui couvre les épaules et les bras, et une jupe ample à taille élastique. Le tissu est fluide, léger et se glisse facilement dans un sac.',
    details: 'Composition : à préciser par la boutique\nEntretien : lavage à 30 °C, repassage doux\nTaille unique ajustable',
    sizes: ['Taille unique'], colors: [{ name: 'Lilas', hex: '#C4B5FD' }, { name: 'Rose poudré', hex: '#E8A5C0' }, { name: 'Prune', hex: '#5B2150' }],
    tags: ['prière', 'deux pièces', 'voile'], imageAlt: 'Robe de prière deux pièces lilas sur cintre',
  },
  {
    slug: 'robe-priere-enfant-petite-perle', name: 'Robe de prière enfant « Petite perle »', cat: 'robes-de-priere',
    price: 7000, isNew: true,
    short: 'Deux pièces pour fillette, finitions dentelle.',
    description: 'La version enfant de notre robe de prière deux pièces : un voile facile à enfiler et une jupe à taille élastique, avec une fine bordure en dentelle.',
    details: 'Entretien : lavage à 30 °C\nTailles indicatives par âge',
    sizes: ['4-6 ans', '7-9 ans', '10-12 ans'], colors: [{ name: 'Rose pâle', hex: '#F9C6DA' }, { name: 'Ivoire', hex: '#F5F0E6' }],
    tags: ['enfant', 'prière'], imageAlt: 'Robe de prière pour enfant rose pâle',
  },
  {
    slug: 'abaya-priere-brodee-nour', name: 'Abaya de prière brodée « Nour »', cat: 'robes-de-priere',
    price: 18000, featured: true,
    short: 'Abaya longue, broderies fines aux manches.',
    description: 'Une abaya longue et fluide, rehaussée de broderies délicates aux manches et aux poignets. Élégante pour la mosquée comme pour les cérémonies.',
    details: 'Entretien : lavage délicat à 30 °C, sur l’envers\nLongueur : à préciser par la boutique',
    sizes: ['M', 'L', 'XL'], colors: [{ name: 'Prune', hex: '#4A1650' }, { name: 'Anthracite', hex: '#2E2A33' }],
    tags: ['abaya', 'broderie', 'cérémonie'], imageAlt: 'Abaya prune brodée sur cintre',
  },
  {
    slug: 'jilbab-capuche-une-piece', name: 'Jilbab une pièce à capuche', cat: 'robes-de-priere',
    price: 14000,
    short: 'Une seule pièce, capuche intégrée, tombé ample.',
    description: 'Un jilbab une pièce qui s’enfile en quelques secondes, avec capuche intégrée et manches larges. Idéal pour la prière à la maison comme à l’extérieur.',
    details: 'Entretien : lavage à 30 °C\nTaille unique',
    sizes: ['Taille unique'], colors: [{ name: 'Mauve', hex: '#9D7BB0' }, { name: 'Gris perle', hex: '#C9C3CF' }],
    tags: ['jilbab', 'prière'], imageAlt: 'Jilbab mauve à capuche sur cintre',
  },
  {
    slug: 'robe-priere-zippee-serenite', name: 'Robe de prière zippée « Sérénité »', cat: 'robes-de-priere',
    price: 13500,
    short: 'Une pièce zippée sur le devant, pratique au quotidien.',
    description: 'Une robe de prière une pièce avec fermeture éclair sur le devant, pour s’habiller rapidement. Coupe ample et tissu doux.',
    details: 'Entretien : lavage à 30 °C\nFermeture éclair sur le devant',
    sizes: ['S/M', 'L/XL'], colors: [{ name: 'Violet doux', hex: '#A78BFA' }, { name: 'Sauge', hex: '#A3AFA0' }],
    tags: ['prière', 'zip'], imageAlt: 'Robe de prière zippée violette pliée avec un chapelet',
  },
  // ------------------------------------------------------------------ Tapis
  {
    slug: 'tapis-priere-velours-medine', name: 'Tapis de prière velours « Médine »', cat: 'tapis-de-priere',
    price: 8000, featured: true,
    short: 'Velours épais, motif mihrab et franges.',
    description: 'Un tapis de prière en velours épais au motif de mihrab traditionnel, bordé de franges. Moelleux sous les genoux et facile à rouler.',
    details: 'Dimensions : environ 70 × 110 cm (à confirmer)\nEntretien : brossage, nettoyage à sec recommandé',
    colors: [{ name: 'Bordeaux', hex: '#7A1F3D' }, { name: 'Émeraude', hex: '#1F5E4E' }, { name: 'Bleu nuit', hex: '#24325E' }],
    tags: ['tapis', 'velours'], imageAlt: 'Tapis de prière en velours bordeaux à motif de mihrab',
  },
  {
    slug: 'tapis-priere-voyage-pliable', name: 'Tapis de prière de voyage pliable', cat: 'tapis-de-priere',
    price: 5000,
    short: 'Léger et pliable, avec pochette et boussole.',
    description: 'Un tapis fin et léger qui se plie dans sa pochette zippée, accompagné d’une petite boussole pour trouver la qibla en déplacement.',
    details: 'Livré avec pochette et boussole\nDimensions dépliées : à préciser',
    colors: [{ name: 'Bleu marine', hex: '#24325E' }, { name: 'Prune', hex: '#5B2150' }],
    tags: ['voyage', 'tapis'], imageAlt: 'Tapis de prière de voyage plié avec sa pochette et une boussole',
  },
  {
    slug: 'tapis-priere-mousse-confort', name: 'Tapis de prière mousse confort', cat: 'tapis-de-priere',
    price: 12000, isNew: true,
    short: 'Rembourrage épais pour soulager genoux et dos.',
    description: 'Un tapis matelassé avec rembourrage en mousse, conçu pour plus de confort lors des longues prières, notamment pour les personnes âgées.',
    details: 'Épaisseur : à préciser\nEntretien : housse lavable (à confirmer)',
    colors: [{ name: 'Gris violet', hex: '#6B5B8C' }, { name: 'Taupe', hex: '#8C7A6B' }],
    tags: ['confort', 'tapis'], imageAlt: 'Tapis de prière matelassé gris violet',
  },
  {
    slug: 'tapis-priere-enfant', name: 'Tapis de prière enfant', cat: 'tapis-de-priere',
    price: 4500,
    short: 'Petit format aux motifs étoiles et croissants.',
    description: 'Un tapis de petit format aux motifs d’étoiles et de croissants, pour accompagner les enfants dans l’apprentissage de la prière.',
    details: 'Petit format adapté aux enfants',
    colors: [{ name: 'Rose', hex: '#F9A8D4' }, { name: 'Bleu ciel', hex: '#93C5FD' }],
    tags: ['enfant', 'tapis'], imageAlt: 'Petit tapis de prière rose pour enfant',
  },
  {
    slug: 'coffret-tapis-chapelet', name: 'Coffret tapis & chapelet', cat: 'tapis-de-priere',
    price: 15000, compareAt: 17500,
    short: 'Un tapis, un chapelet et un joli coffret à offrir.',
    description: 'Un coffret cadeau réunissant un tapis de prière et un chapelet assorti, présentés dans une boîte rigide avec ruban. Une attention appréciée pour un mariage, un baptême ou un retour de pèlerinage.',
    details: 'Contenu : 1 tapis + 1 chapelet\nBoîte cadeau incluse',
    colors: [{ name: 'Violet', hex: '#5B21B6' }, { name: 'Magenta', hex: '#C026D3' }],
    tags: ['cadeau', 'coffret'], imageAlt: 'Coffret ouvert contenant un tapis de prière et un chapelet',
  },
  // ------------------------------------------------------------------ Parfums
  {
    slug: 'eau-de-parfum-oud-royal', name: 'Eau de parfum « Oud Royal »', cat: 'parfums',
    price: 15000, featured: true, option1Name: 'Contenance',
    short: 'Notes boisées d’oud, d’ambre et de musc.',
    description: 'Un parfum oriental aux notes boisées d’oud, réchauffées par l’ambre et le musc. Un sillage présent, à porter le soir ou pour les grandes occasions.',
    details: 'Famille : orientale boisée\nUsage externe uniquement',
    sizes: ['50 ml', '100 ml'], priceBySize: { '50 ml': 9000, '100 ml': 15000 },
    tags: ['oud', 'oriental'], imageAlt: 'Flacon carré de parfum ambré au bouchon sombre',
  },
  {
    slug: 'huile-parfumee-musc-blanc', name: 'Huile parfumée musc blanc', cat: 'parfums',
    price: 3500,
    short: 'Huile sans alcool en roll-on de 12 ml.',
    description: 'Une huile parfumée douce au musc blanc, sans alcool, en flacon roll-on à glisser dans le sac.',
    details: 'Contenance : 12 ml\nSans alcool',
    colors: [{ name: 'Musc blanc', hex: '#F3EEE6' }, { name: 'Musc rose', hex: '#F7C6D9' }],
    tags: ['musc', 'sans alcool'], imageAlt: 'Petit flacon roll-on d’huile parfumée',
  },
  {
    slug: 'coffret-trio-parfums-femme', name: 'Coffret trio parfums femme', cat: 'parfums',
    price: 25000, compareAt: 30000,
    short: 'Trois parfums floraux dans un coffret cadeau.',
    description: 'Trois flacons de parfums floraux réunis dans un coffret prêt à offrir. Une jolie façon de découvrir plusieurs senteurs.',
    details: 'Contenu : 3 flacons (contenances à préciser)\nBoîte cadeau incluse',
    tags: ['coffret', 'cadeau', 'floral'], imageAlt: 'Coffret ouvert avec trois flacons de parfum',
  },
  {
    slug: 'brume-corporelle-fleur-oranger', name: 'Brume corporelle « Fleur d’oranger »', cat: 'parfums',
    price: 6000, isNew: true,
    short: 'Une brume fraîche et légère pour le corps.',
    description: 'Une brume légère aux notes de fleur d’oranger, à vaporiser sur la peau ou les vêtements pour une sensation de fraîcheur.',
    details: 'Contenance : à préciser\nUsage externe uniquement',
    tags: ['brume', 'fleur d’oranger'], imageAlt: 'Flacon vaporisateur de brume corporelle avec une branche de fleur d’oranger',
  },
  {
    slug: 'thiouraye-nuit-de-dakar', name: 'Thiouraye « Nuit de Dakar »', cat: 'parfums',
    price: 4000, featured: true,
    short: 'Encens traditionnel pour parfumer la maison.',
    description: 'Un thiouraye aux notes chaudes et enveloppantes, à faire brûler sur du charbon dans un encensoir pour parfumer la maison et le linge.',
    details: 'Conditionnement : sachet (poids à préciser)\nNe jamais laisser un encensoir allumé sans surveillance',
    tags: ['thiouraye', 'encens', 'maison'], imageAlt: 'Encensoir en terre cuite avec fumée et sachet d’encens',
  },
  // ------------------------------------------------------------------ Friperie
  {
    slug: 'jean-droit-femme', name: 'Jean droit femme', cat: 'friperie',
    price: 6000, condition: 'Très bon état — sélectionné et lavé',
    short: 'Coupe droite, denim épais. Pièce de seconde main.',
    description: 'Un jean coupe droite en denim épais, sélectionné pour son très bon état. Chaque pièce de friperie est unique : la teinte peut légèrement varier.',
    details: 'Article de seconde main\nÉtat : très bon',
    sizes: ['36', '38', '40', '42'], stock: 1,
    tags: ['friperie', 'jean'], imageAlt: 'Jean droit bleu plié',
  },
  {
    slug: 'chemise-homme-coton', name: 'Chemise homme en coton', cat: 'friperie',
    price: 4000, condition: 'Très bon état — lavée et repassée',
    short: 'Chemise de seconde main, lavée et repassée.',
    description: 'Une chemise en coton de seconde main, sélectionnée, lavée et repassée. Pièce unique.',
    details: 'Article de seconde main\nÉtat : très bon',
    sizes: ['M', 'L', 'XL'], stock: 1,
    tags: ['friperie', 'homme'], imageAlt: 'Chemise homme rayée pliée',
  },
  {
    slug: 'veste-jean-vintage', name: 'Veste en jean vintage', cat: 'friperie',
    price: 9000, condition: 'Bon état — légères traces d’usure',
    short: 'Veste en jean au style intemporel.',
    description: 'Une veste en jean vintage, coupe classique. Les légères traces d’usure font partie de son charme : voir l’état précisé ci-dessous.',
    details: 'Article de seconde main\nÉtat : bon, légères traces d’usure',
    sizes: ['S', 'M'], stock: 1, isNew: true,
    tags: ['friperie', 'vintage'], imageAlt: 'Veste en jean sur cintre',
  },
  {
    slug: 'robe-ete-fleurie', name: 'Robe d’été fleurie', cat: 'friperie',
    price: 7000, condition: 'Très bon état',
    short: 'Robe midi légère à imprimé fleuri.',
    description: 'Une robe midi fluide à imprimé fleuri, idéale pour les journées chaudes. Pièce de seconde main en très bon état.',
    details: 'Article de seconde main\nÉtat : très bon',
    sizes: ['S', 'M', 'L'], stock: 1,
    tags: ['friperie', 'robe'], imageAlt: 'Robe d’été ivoire à fleurs sur cintre',
  },
  // ------------------------------------------------------------------ Ensembles chez Cathy
  {
    slug: 'ensemble-wax-deux-pieces', name: 'Ensemble wax deux pièces', cat: 'ensembles-chez-cathy',
    price: 20000, featured: true, isNew: true,
    short: 'Haut et jupe en wax, coupe moderne.',
    description: 'Un ensemble haut + jupe en tissu wax aux motifs graphiques, coupé pour un tombé moderne. À porter ensemble ou séparément.',
    details: 'Tissu : wax\nEntretien : lavage à l’envers à 30 °C',
    sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Magenta & orange', hex: '#C026D3' }, { name: 'Bleu & jaune', hex: '#2747A8' }],
    tags: ['wax', 'ensemble'], imageAlt: 'Ensemble wax deux pièces magenta et orange sur cintre',
  },
  {
    slug: 'ensemble-lin-ete', name: 'Ensemble lin été', cat: 'ensembles-chez-cathy',
    price: 17000,
    short: 'Chemise ample et pantalon large en lin.',
    description: 'Un ensemble léger composé d’une chemise ample et d’un pantalon large, parfait pour la chaleur.',
    details: 'Tissu : lin (composition à préciser)\nEntretien : lavage à 30 °C',
    sizes: ['S', 'M', 'L'], colors: [{ name: 'Sable', hex: '#D8C7A8' }, { name: 'Lilas', hex: '#C9B6E4' }],
    tags: ['lin', 'été'], imageAlt: 'Ensemble en lin couleur sable plié',
  },
  {
    slug: 'ensemble-tunique-pantalon-brode', name: 'Ensemble tunique & pantalon brodé', cat: 'ensembles-chez-cathy',
    price: 22000,
    short: 'Tunique longue à encolure brodée et pantalon assorti.',
    description: 'Une tunique longue à l’encolure brodée, accompagnée d’un pantalon droit assorti. Une tenue élégante pour les fêtes et les visites.',
    details: 'Entretien : lavage délicat',
    sizes: ['M', 'L', 'XL'], colors: [{ name: 'Émeraude', hex: '#1F6B57' }, { name: 'Prune', hex: '#5B2150' }],
    tags: ['brodé', 'ensemble', 'fête'], imageAlt: 'Tunique émeraude brodée et pantalon sur cintre',
  },
  {
    slug: 'ensemble-enfant-wax', name: 'Ensemble enfant wax', cat: 'ensembles-chez-cathy',
    price: 9000,
    short: 'Haut et short en wax pour enfant.',
    description: 'Un ensemble haut + short en wax coloré pour les enfants, confortable pour jouer comme pour les fêtes.',
    details: 'Tailles indicatives par âge',
    sizes: ['2-4 ans', '5-7 ans', '8-10 ans'], colors: [{ name: 'Rose & jaune', hex: '#EC4899' }, { name: 'Vert & violet', hex: '#3F8F5A' }],
    tags: ['enfant', 'wax'], imageAlt: 'Ensemble enfant en wax rose et jaune posé à plat',
  },
  // ------------------------------------------------------------------ Maroc
  {
    slug: 'savon-noir-beldi', name: 'Savon noir beldi', cat: 'produits-du-maroc',
    price: 3000,
    short: 'Savon noir traditionnel pour le rituel du hammam.',
    description: 'Le savon noir beldi s’utilise lors du rituel du hammam : appliqué sur peau humide, il prépare la peau au gommage avec un gant kessa.',
    details: 'Contenance : à préciser\nUsage externe uniquement',
    tags: ['hammam', 'soin'], imageAlt: 'Pot de savon noir et gant kessa',
  },
  {
    slug: 'huile-argan-cosmetique', name: 'Huile d’argan cosmétique', cat: 'produits-du-maroc',
    price: 8000, featured: true,
    short: 'Pour la peau et les cheveux, flacon compte-gouttes.',
    description: 'Une huile d’argan à usage cosmétique, à appliquer en quelques gouttes sur la peau, les cheveux ou les ongles.',
    details: 'Contenance : 100 ml (à confirmer)\nUsage externe uniquement',
    tags: ['argan', 'soin', 'cheveux'], imageAlt: 'Flacon compte-gouttes d’huile d’argan et noix d’argan',
  },
  {
    slug: 'caftan-brode', name: 'Caftan brodé', cat: 'produits-du-maroc',
    price: 35000,
    short: 'Caftan satiné orné d’une sfifa et de boutons.',
    description: 'Un caftan au tissu satiné, orné d’une sfifa (passementerie) le long du devant et de petits boutons. Une pièce de fête.',
    details: 'Entretien : nettoyage à sec recommandé',
    sizes: ['M', 'L', 'XL'], colors: [{ name: 'Violet royal', hex: '#5B21B6' }, { name: 'Émeraude', hex: '#1F6B57' }],
    tags: ['caftan', 'fête'], imageAlt: 'Caftan violet brodé sur cintre',
  },
  {
    slug: 'ghassoul-argile', name: 'Ghassoul (argile du Maroc)', cat: 'produits-du-maroc',
    price: 3500,
    short: 'Argile lavante pour masques visage et cheveux.',
    description: 'Le ghassoul est une argile traditionnellement utilisée au Maroc en masque pour le visage et les cheveux. À mélanger avec de l’eau tiède.',
    details: 'Poids : à préciser\nUsage externe uniquement',
    tags: ['argile', 'soin'], imageAlt: 'Bol de ghassoul et cuillère en bois',
  },
  {
    slug: 'theiere-marocaine', name: 'Théière marocaine & verres', cat: 'produits-du-maroc',
    price: 16000, compareAt: 18000,
    short: 'Théière ciselée et deux verres décorés.',
    description: 'Une théière marocaine au métal ciselé, accompagnée de deux verres décorés, pour servir le thé dans les règles de l’art.',
    details: 'Contenu : 1 théière + 2 verres\nMatériau : à préciser',
    tags: ['thé', 'art de la table', 'cadeau'], imageAlt: 'Théière marocaine argentée et deux verres à thé',
  },
  // ------------------------------------------------------------------ Importés
  {
    slug: 'mini-ventilateur-rechargeable', name: 'Mini ventilateur rechargeable', cat: 'produits-importes',
    price: 5000,
    short: 'Ventilateur portable USB, 3 vitesses.',
    description: 'Un petit ventilateur rechargeable par USB, avec trois vitesses, à poser sur un bureau ou à tenir en main.',
    details: 'Recharge : USB (câble inclus, à confirmer)\nAutonomie : à préciser',
    colors: [{ name: 'Blanc lilas', hex: '#E9E1F7' }, { name: 'Rose', hex: '#F9A8D4' }], stock: 0,
    tags: ['chaleur', 'pratique'], imageAlt: 'Mini ventilateur portable blanc et lilas',
  },
  {
    slug: 'organisateur-cosmetiques-rotatif', name: 'Organisateur cosmétiques rotatif', cat: 'produits-importes',
    price: 7500,
    short: 'Présentoir transparent rotatif pour maquillage.',
    description: 'Un présentoir rotatif en matière transparente pour ranger rouges à lèvres, pinceaux et petits flacons.',
    details: 'Dimensions : à préciser',
    tags: ['rangement', 'beauté'], imageAlt: 'Organisateur de maquillage rotatif transparent',
  },
  {
    slug: 'sac-main-structure', name: 'Sac à main structuré', cat: 'produits-importes',
    price: 14000, isNew: true,
    short: 'Sac à anse avec fermoir doré.',
    description: 'Un sac à main structuré avec anse supérieure et fermoir doré, assez grand pour l’essentiel de la journée.',
    details: 'Matière : à préciser\nDimensions : à préciser',
    colors: [{ name: 'Prune', hex: '#5B2150' }, { name: 'Blush', hex: '#EBB7C8' }],
    tags: ['accessoire', 'sac'], imageAlt: 'Sac à main structuré prune avec fermoir doré',
  },
  {
    slug: 'gourde-isotherme', name: 'Gourde isotherme', cat: 'produits-importes',
    price: 6500,
    short: 'Gourde en inox à double paroi.',
    description: 'Une gourde en acier inoxydable à double paroi, pratique pour garder sa boisson au frais toute la journée.',
    details: 'Contenance : à préciser',
    colors: [{ name: 'Violet mat', hex: '#6D4AA8' }, { name: 'Rose mat', hex: '#E58BB4' }],
    tags: ['pratique', 'eau'], imageAlt: 'Gourde isotherme violette',
  },
  // ------------------------------------------------------------------ Lasalmah
  {
    slug: 'lasalmah-coffret-signature', name: 'Lasalmah — Coffret signature (exemple)', cat: 'lasalmah',
    price: 22000,
    short: 'Article d’exemple : contenu à définir par la boutique.',
    description: 'Fiche d’exemple pour la sélection Lasalmah. Remplacez ce texte par la description réelle du produit depuis l’administration.',
    details: 'À compléter',
    tags: ['lasalmah', 'coffret'], imageAlt: 'Coffret cadeau violet fermé par un ruban',
  },
  {
    slug: 'lasalmah-coffret-decouverte', name: 'Lasalmah — Coffret découverte (exemple)', cat: 'lasalmah',
    price: 10000,
    short: 'Article d’exemple : contenu à définir par la boutique.',
    description: 'Fiche d’exemple pour la sélection Lasalmah. Remplacez ce texte par la description réelle du produit depuis l’administration.',
    details: 'À compléter',
    tags: ['lasalmah', 'coffret'], imageAlt: 'Petit coffret ouvert garni de papier de soie',
  },
];

function buildVariants(s: Spec, productId: string): ProductVariant[] {
  const sizes = s.sizes ?? [null];
  const colors: (Color | null)[] = s.colors ?? [null];
  const out: ProductVariant[] = [];
  let position = 0;
  for (const size of sizes) {
    for (const color of colors) {
      const key = `${s.slug}:${size ?? '-'}:${color?.name ?? '-'}`;
      const stock = s.stock ?? (seededInt(key, 0, 14) === 0 ? 0 : seededInt(key + 'q', 2, 14));
      out.push({
        id: demoId('variant:' + key),
        product_id: productId,
        sku: null,
        option1: size,
        option2: color?.name ?? null,
        color_hex: color?.hex ?? null,
        price_override: size && s.priceBySize?.[size] != null && s.priceBySize[size] !== s.price ? s.priceBySize[size] : null,
        stock,
        is_active: true,
        position: position++,
      });
    }
  }
  return out;
}

function buildImages(s: Spec, productId: string): ProductImage[] {
  const alts = [s.imageAlt, `${s.name} — détail`, `${s.name} — autre vue`];
  return [1, 2, 3].map((n, i) => ({
    id: demoId(`image:${s.slug}:${n}`),
    product_id: productId,
    url: `/demo/products/${s.slug}-${n}.svg`,
    thumb_url: null,
    alt: `${alts[i]} (illustration de démonstration)`,
    width: 800,
    height: 1000,
    position: i,
  }));
}

export const demoProducts: ProductWithRelations[] = SPECS.map((s, i) => {
  const id = demoId('product:' + s.slug);
  const product: Product = {
    id,
    slug: s.slug,
    name: s.name,
    category_id: catId(s.cat),
    short_description: s.short,
    description: s.description,
    details: s.details,
    price: s.priceBySize ? Math.min(...Object.values(s.priceBySize)) : s.price,
    compare_at_price: s.compareAt ?? null,
    status: 'published',
    is_featured: !!s.featured,
    is_new: !!s.isNew,
    condition_note: s.condition ?? null,
    tags: s.tags ?? [],
    option1_name: s.option1Name ?? 'Taille',
    option2_name: 'Couleur',
    seo_title: null,
    seo_description: null,
    sort_order: i,
    is_demo: true,
    published_at: DEMO_TIMESTAMP,
    created_at: new Date(Date.parse(DEMO_TIMESTAMP) + i * 60_000).toISOString(),
    updated_at: DEMO_TIMESTAMP,
  };
  // le prix de base = plus petit prix ; les autres contenances via price_override
  const variants = buildVariants({ ...s, price: product.price }, id);
  return { ...product, variants, images: buildImages(s, id) };
});

const pid = (slug: string) => demoId('product:' + slug);

export const demoCollections: Collection[] = [
  {
    slug: 'essentiels-de-la-priere', name: 'Les essentiels de la prière',
    description: 'Robes, tapis et thiouraye : tout pour un coin prière apaisant.',
    image_url: '/demo/categories/tapis-de-priere.svg', is_featured: true,
    product_ids: ['robe-priere-deux-pieces-lilas', 'jilbab-capuche-une-piece', 'tapis-priere-velours-medine', 'tapis-priere-mousse-confort', 'tapis-priere-voyage-pliable', 'thiouraye-nuit-de-dakar'],
  },
  {
    slug: 'idees-cadeaux', name: 'Idées cadeaux',
    description: 'Coffrets, parfums et douceurs du Maroc à offrir.',
    image_url: '/demo/categories/parfums.svg', is_featured: true,
    product_ids: ['coffret-tapis-chapelet', 'coffret-trio-parfums-femme', 'eau-de-parfum-oud-royal', 'theiere-marocaine', 'lasalmah-coffret-signature', 'sac-main-structure'],
  },
  {
    slug: 'rituel-hammam', name: 'Rituel hammam',
    description: 'Savon noir, ghassoul et huile d’argan pour un moment de soin à la maison.',
    image_url: '/demo/categories/produits-du-maroc.svg', is_featured: true,
    product_ids: ['savon-noir-beldi', 'ghassoul-argile', 'huile-argan-cosmetique', 'brume-corporelle-fleur-oranger'],
  },
].map((c, i) => ({
  ...c,
  id: demoId('collection:' + c.slug),
  is_published: true,
  sort_order: i,
  is_demo: true,
  product_ids: c.product_ids.map(pid),
}));
