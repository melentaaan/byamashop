# Guide de la propriétaire — Byamashop

Ce guide explique comment gérer votre boutique au quotidien, depuis votre téléphone ou votre ordinateur. Aucune connaissance technique n’est nécessaire.

## 1. Se connecter

1. Ouvrez **votre-site/admin** (par exemple `https://byamashop.netlify.app/admin`).
2. Saisissez votre e-mail et votre mot de passe.
3. Mot de passe oublié ? Saisissez votre e-mail puis touchez **« Mot de passe oublié ? »** : vous recevez un lien par e-mail.
4. Pour changer de mot de passe : menu **☰** › **Changer mon mot de passe**.

Sur téléphone, le menu s’ouvre avec le bouton **☰** en haut à gauche.

> 🔒 Ne partagez jamais votre mot de passe. Si une autre personne doit vous aider, demandez la création d’un compte séparé.

## 2. Le tableau de bord

Il affiche **uniquement vos vraies commandes** (les commandes marquées « test » ne sont pas comptées) :

- **Commandes reçues** sur la période choisie (7 jours, 30 jours…) ;
- **Ventes confirmées** : commandes que vous avez marquées « payées » ;
- **Chiffre d’affaires encaissé** : total des commandes payées ;
- **En attente de paiement** : argent pas encore reçu ;
- **Produits les plus commandés** et **stock bas** ;
- la liste **« Avant l’ouverture au public »** : ce qu’il reste à compléter.

Tant qu’il n’y a pas de commande, le tableau de bord l’indique simplement : aucun chiffre n’est inventé.

## 3. Traiter une commande (le plus important)

Quand une cliente valide sa commande sur le site :

- la commande est **enregistrée** avec une **référence** (ex. `BY-261108-K7QM`) ;
- le **stock est réservé** automatiquement ;
- elle apparaît dans **Commandes** avec le statut **Nouvelle** et **Paiement en attente**.

⚠️ Une cliente qui vous écrit sur WhatsApp **ne valide pas** sa commande ni son paiement : c’est toujours vous qui confirmez.

**Étapes conseillées** (menu **Commandes** › touchez la commande) :

1. **Vérifier** les articles, l’adresse et le téléphone.
2. **Écrire à la cliente** : section *Écrire au client sur WhatsApp* → message prérempli (« Confirmer la commande », « Envoyer les instructions de paiement »…). Ces boutons ouvrent WhatsApp sans rien modifier.
3. **Confirmer la commande** (bouton en haut).
4. **Quand l’argent est reçu** (Wave, Orange Money ou espèces), et seulement après l’avoir vérifié sur votre téléphone : **« Marquer comme payée »**. Vous pouvez noter la référence de la transaction. La cliente voit alors « Payée » sur sa page de suivi.
5. **En préparation** → **Expédiée / en livraison** → **Livrée** → **Terminer**.

**Annuler une commande** : bouton **Annuler**. Les articles sont **remis en stock automatiquement**. Une commande annulée ne peut pas être réactivée.

**Commande de test** : si vous passez une commande pour essayer, cochez **« Commande de test »** pour l’exclure des statistiques, puis annulez-la.

**Rechercher** une commande : par référence, nom ou numéro de téléphone. **Exporter** : bouton *Exporter (CSV)* pour ouvrir la liste dans Excel.

## 4. Les produits

Menu **Produits & stock**.

### Ajouter un produit
1. **Nouveau produit**.
2. **Nom**, **catégorie**, **phrase d’accroche**, **description**, **détails & entretien** (une information par ligne).
3. **Photos** : touchez **Ajouter des photos** (vous pouvez prendre une photo directement avec le téléphone). Elles sont **réduites automatiquement** pour que le site reste rapide. La **première photo** est la photo principale ; utilisez les flèches pour changer l’ordre. Ajoutez une courte description (utile pour l’accessibilité et Google).
4. **Prix de vente** en FCFA (sans espace ni virgule). *Prix barré* : facultatif, affiché barré à côté.
5. **Tailles, couleurs & stock** :
   - produit **sans taille ni couleur** : une seule ligne, indiquez le stock ;
   - sinon, **« Créer rapidement toutes les combinaisons »** : tapez par ex. `S, M, L` et `Noir, Prune`, puis **Générer les variantes**, et indiquez le stock de chaque ligne ;
   - *Teinte* : la pastille de couleur affichée aux clientes ;
   - *Prix spécifique* : si une variante a un autre prix (ex. parfum 50 ml / 100 ml).
6. **Statut** : *En ligne* (visible), *Brouillon* (caché, pour préparer), *Archivé* (caché mais conservé).
7. **Enregistrer** (bouton en bas).

**Articles de friperie** : remplissez le champ **État** (ex. « Très bon état ») : il est affiché clairement sur la fiche.

### Modifier le stock rapidement
Dans la liste, bouton **Stock** sur la ligne du produit → modifiez les quantités → **Enregistrer le stock**. Le stock baisse tout seul à chaque commande et remonte si vous annulez.

### Retirer un produit
- **Retirer** (dans la liste) : le produit est caché, vous pouvez le republier plus tard.
- **Archiver** : caché et rangé.
- **Supprimer** : définitif. Les anciennes commandes gardent le nom et le prix de l’article.

### Importer beaucoup de produits (Excel / Google Sheets)
**Produits › Importer** → téléchargez le **modèle**, remplissez-le (une ligne par taille/couleur), enregistrez en CSV, puis importez. Le site vous montre un **aperçu** et les **erreurs ligne par ligne** avant d’importer. Si un produit existe déjà (même « slug »), il est **mis à jour** au lieu d’être dupliqué.

## 5. Catégories, collections et promotions

Menu **Catégories & promos**.

- **Catégories** : nom, description, image de couverture, ordre d’affichage.
- **Collections** : regroupements à thème (Idées cadeaux, Spécial Ramadan…) affichés sur l’accueil si vous cochez « Afficher sur l’accueil ».
- **Promotions** : une remise en % sur une catégorie, une collection, des produits choisis ou toute la boutique, avec dates de début et de fin facultatives. Le nouveau prix est calculé automatiquement et l’ancien est barré. Si deux promotions se cumulent, seule la plus forte s’applique.

## 6. Réglages de la boutique

Menu **Réglages boutique**. Pensez à **Enregistrer les réglages** en bas.

- **Contact** : WhatsApp (format `221771234567`), téléphone, e-mail, adresse, horaires, bandeau d’annonce.
- **Réseaux sociaux** : collez l’adresse complète (`https://instagram.com/...`). Seuls les liens remplis apparaissent.
- **Paiement** : activez Wave / Orange Money / paiement à la livraison, indiquez **vos numéros de réception** et les instructions. Ces informations sont montrées à la cliente **après** sa commande.
- **Livraison** : chaque zone a ses **frais**, un **délai indicatif** et éventuellement « offerte dès » un montant. Bouton **Enregistrer** sur chaque ligne. Décochez *Active* pour masquer une zone sans la supprimer.
- **Page d’accueil** : grand titre (mettez des mots entre `*astérisques*` pour les mettre en couleur), texte, image, bannière promotionnelle, texte « À propos », section revendeurs, newsletter.
- **Informations légales** : raison sociale, forme juridique, NINEA, RCCM… Elles sont insérées automatiquement dans les pages légales.
- **Pages** : modifiez les **CGV, livraison, retours, confidentialité, mentions légales**. Les passages surlignés **« À COMPLÉTER »** doivent être remplis. ⚠️ Ces textes sont des **modèles** : faites-les vérifier par un juriste avant l’ouverture.
- **Catalogue de démonstration** : quand vos vrais produits sont en ligne, supprimez les produits d’exemple en un clic. Vos produits, commandes et réglages ne sont pas touchés.

## 7. Messages et newsletter

Menu **Messages** :

- **Messages** : envoyés depuis la page Contact ou Revendeurs. Répondez par WhatsApp, appel ou e-mail, puis cochez **Traité**.
- **Newsletter** : les personnes ayant accepté de recevoir vos e-mails. **Exportez** la liste pour l’utiliser dans un outil d’e-mailing (Brevo, Mailchimp…). Le site n’envoie pas lui-même d’e-mails publicitaires. Supprimez une personne si elle le demande.

## 8. Ce que voient vos clientes

- Leur **panier** et leurs **favoris** restent sur leur téléphone, même après fermeture.
- Après la commande : une page avec la **référence**, le **suivi** (Nouvelle → Confirmée → En préparation → Prête → Terminée), le **statut du paiement** et les **instructions de paiement**. Le lien de cette page est personnel : elle peut le garder pour suivre sa commande.

## 9. Bonnes pratiques

- **Photos** : lumière du jour, fond clair et uni, format portrait si possible, 3 photos par produit (ensemble, détail, porté ou autre angle).
- **Stock** : mettez-le à jour dès qu’un article est vendu ailleurs (boutique physique, WhatsApp direct) pour éviter de vendre un article qui n’existe plus.
- **Paiement** : ne marquez jamais une commande « payée » avant d’avoir vu l’argent sur votre compte.
- **Exports** : exportez vos commandes chaque mois (sauvegarde).

En cas de problème technique (site qui ne charge plus, erreur à l’enregistrement), notez le message affiché et contactez la personne qui gère l’hébergement.
