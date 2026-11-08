/* =========================================================
   BYAMASHOP — CONFIGURATION & CATALOGUE
   C'est le SEUL fichier à modifier pour gérer la boutique.
   ========================================================= */

const SHOP = {
  name: "Byamashop",
  whatsapp: "221764091727",        // Numéro WhatsApp (format international sans + ni espaces)
  phone: "+221 76 409 17 27",      // Numéro affiché
  address: "Dakar, Sénégal",       // ⚠️ Votre adresse / quartier
  currency: "FCFA",
  instagram: "#",                  // ⚠️ Liens réseaux sociaux
  tiktok: "#",
  facebook: "#",
  // Frais de livraison par zone
  zones: [
    { name: "Dakar (centre & banlieue)", fee: 1500 },
    { name: "Pikine / Guédiawaye / Rufisque", fee: 2000 },
    { name: "Thiès / Mbour", fee: 3000 },
    { name: "Autres régions", fee: 4000 },
    { name: "Retrait en boutique", fee: 0 }
  ]
};

/* Catégories (id, nom, emoji, couleurs du visuel par défaut) */
const CATEGORIES = [
  { id: "robes",     name: "Robes de prière",    emoji: "🧕", colors: ["#7C3AED", "#C084FC"] },
  { id: "parfums",   name: "Parfums",            emoji: "🌸", colors: ["#FF6FB5", "#FBCFE8"] },
  { id: "tapis",     name: "Tapis de prière",    emoji: "🕌", colors: ["#16A34A", "#86EFAC"] },
  { id: "friperie",  name: "Friperie",           emoji: "👕", colors: ["#E11D48", "#FDA4AF"] },
  { id: "cathy",     name: "Ensembles chez Cathy", emoji: "👗", colors: ["#C026D3", "#F0ABFC"] },
  { id: "alibaba",   name: "Produits Alibaba",   emoji: "📦", colors: ["#F97316", "#FED7AA"] },
  { id: "maroc",     name: "Produits du Maroc",  emoji: "🫖", colors: ["#DC2626", "#4ADE80"] },
  { id: "lasalmah",  name: "Lasalmah",           emoji: "💎", colors: ["#6D28D9", "#FF6FB5"] }
];

/* Produits
   - image : mettez le chemin de votre photo, ex. "assets/products/robe1.jpg"
             (laissez "" pour afficher un visuel coloré automatique)
   - oldPrice : prix barré (optionnel, mettre 0 sinon)
   - tag : "Nouveau", "Promo", "Best-seller"... (optionnel)              */
const PRODUCTS = [
  { id: 1,  cat: "robes",    name: "Robe de prière 2 pièces — Lilas",  price: 12000, oldPrice: 15000, tag: "Promo",  image: "", desc: "Robe de prière deux pièces avec voile intégré, tissu fluide et respirant. Taille unique ajustable.", sizes: ["Taille unique"] },
  { id: 2,  cat: "robes",    name: "Robe de prière enfant",            price: 7000,  oldPrice: 0,     tag: "Nouveau", image: "", desc: "Jolie robe de prière pour fillette, douce et facile à enfiler.", sizes: ["4-6 ans", "7-9 ans", "10-12 ans"] },
  { id: 3,  cat: "robes",    name: "Abaya de prière brodée",           price: 18000, oldPrice: 0,     tag: "",       image: "", desc: "Abaya longue avec broderies fines aux manches. Élégante pour la mosquée et les cérémonies.", sizes: ["M", "L", "XL"] },
  { id: 4,  cat: "parfums",  name: "Parfum oriental Oud 100 ml",       price: 15000, oldPrice: 0,     tag: "Best-seller", image: "", desc: "Notes boisées d'oud, ambre et musc. Longue tenue.", sizes: [] },
  { id: 5,  cat: "parfums",  name: "Musc blanc — huile 12 ml",         price: 3500,  oldPrice: 0,     tag: "",       image: "", desc: "Huile parfumée sans alcool, douce et propre. Format roll-on.", sizes: [] },
  { id: 6,  cat: "parfums",  name: "Coffret parfums femme (3 pcs)",    price: 25000, oldPrice: 30000, tag: "Promo",  image: "", desc: "Coffret cadeau de trois parfums floraux. Idéal pour offrir.", sizes: [] },
  { id: 7,  cat: "tapis",    name: "Tapis de prière velours",          price: 8000,  oldPrice: 0,     tag: "Best-seller", image: "", desc: "Tapis épais et moelleux, motifs traditionnels. 70 × 110 cm.", sizes: [] },
  { id: 8,  cat: "tapis",    name: "Tapis de prière de voyage",        price: 5000,  oldPrice: 0,     tag: "",       image: "", desc: "Léger et pliable avec pochette et boussole qibla.", sizes: [] },
  { id: 9,  cat: "tapis",    name: "Tapis mousse confort",             price: 12000, oldPrice: 0,     tag: "Nouveau", image: "", desc: "Rembourrage mousse pour soulager genoux et dos.", sizes: [] },
  { id: 10, cat: "friperie", name: "Lot jeans femme",                  price: 6000,  oldPrice: 0,     tag: "",       image: "", desc: "Jeans de friperie en très bon état, sélectionnés.", sizes: ["36", "38", "40", "42"] },
  { id: 11, cat: "friperie", name: "Chemise homme premium",            price: 4000,  oldPrice: 0,     tag: "",       image: "", desc: "Chemises de marque, lavées et repassées.", sizes: ["M", "L", "XL"] },
  { id: 12, cat: "cathy",    name: "Ensemble wax 2 pièces",            price: 20000, oldPrice: 0,     tag: "Nouveau", image: "", desc: "Ensemble haut + jupe en wax, coupe moderne. Disponible chez Cathy.", sizes: ["S", "M", "L", "XL"] },
  { id: 13, cat: "cathy",    name: "Ensemble lin été",                 price: 17000, oldPrice: 0,     tag: "",       image: "", desc: "Ensemble léger en lin, parfait pour la chaleur.", sizes: ["S", "M", "L"] },
  { id: 14, cat: "alibaba",  name: "Mini ventilateur rechargeable",    price: 5000,  oldPrice: 0,     tag: "",       image: "", desc: "Ventilateur portable USB, 3 vitesses.", sizes: [] },
  { id: 15, cat: "alibaba",  name: "Organisateur cosmétiques",         price: 7500,  oldPrice: 0,     tag: "",       image: "", desc: "Présentoir rotatif transparent pour maquillage et parfums.", sizes: [] },
  { id: 16, cat: "maroc",    name: "Savon noir beldi",                 price: 3000,  oldPrice: 0,     tag: "",       image: "", desc: "Savon noir traditionnel marocain à l'huile d'olive.", sizes: [] },
  { id: 17, cat: "maroc",    name: "Huile d'argan pure 100 ml",        price: 8000,  oldPrice: 0,     tag: "Best-seller", image: "", desc: "Huile d'argan cosmétique pour peau et cheveux.", sizes: [] },
  { id: 18, cat: "maroc",    name: "Caftan marocain",                  price: 35000, oldPrice: 0,     tag: "",       image: "", desc: "Caftan brodé main, tissu satiné.", sizes: ["M", "L", "XL"] },
  { id: 19, cat: "lasalmah", name: "Lasalmah — Coffret signature",     price: 22000, oldPrice: 0,     tag: "Nouveau", image: "", desc: "Produit de la collection Lasalmah. Modifiez cette description dans products.js.", sizes: [] },
  { id: 20, cat: "lasalmah", name: "Lasalmah — Article 2",             price: 10000, oldPrice: 0,     tag: "",       image: "", desc: "Produit de la collection Lasalmah. Modifiez cette description dans products.js.", sizes: [] }
];
