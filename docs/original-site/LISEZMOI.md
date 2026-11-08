# Byamashop — guide rapide

## Mettre en ligne sur Netlify
1. Allez sur https://app.netlify.com/drop
2. Glissez-déposez le dossier **byamashop** entier (ou le fichier .zip décompressé).
3. Votre site est en ligne. Dans *Site settings* vous pouvez changer le nom (ex. byamashop.netlify.app).

## Personnaliser (fichier `products.js` uniquement)
- **WhatsApp** : remplacez `221770000000` par votre numéro (format 221 + numéro, sans + ni espaces).
- **Téléphone, adresse, réseaux sociaux** : en haut du fichier, bloc `SHOP`.
- **Frais de livraison** : liste `zones`.
- **Produits** : liste `PRODUCTS`. Copiez une ligne pour ajouter un produit, changez `id` (unique), `name`, `price`, `desc`, `cat`.

## Ajouter vos photos
1. Mettez vos photos dans `assets/products/` (ex. `robe1.jpg`). Format carré conseillé.
2. Dans `products.js`, mettez `image: "assets/products/robe1.jpg"`.
Sans photo, un visuel coloré s'affiche automatiquement.

## Commandes
Le client remplit son panier → la commande s'ouvre dans WhatsApp, prête à vous être envoyée.
Sur Netlify, chaque commande et chaque message de contact est aussi enregistré dans l'onglet **Forms** de votre tableau de bord (activez « Form detection » si demandé).
