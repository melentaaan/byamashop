import { expect, test } from '@playwright/test';
import { addProduct, amount } from './helpers';

test('1. navigation dans le catalogue : accueil → catégorie → fiche produit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Élégance');
  await page.locator('.category-card', { hasText: 'Tapis de prière' }).click();
  await expect(page).toHaveURL(/\/categorie\/tapis-de-priere/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tapis de prière' })).toBeVisible();
  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(5);
  await cards.filter({ hasText: 'Tapis de prière de voyage' }).getByRole('link', { name: /voyage/ }).last().click();
  await expect(page).toHaveURL(/\/produit\/tapis-priere-voyage-pliable/);
  await expect(page.getByTestId('pdp-price')).toContainText(amount(5000));
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/produit\/tapis-priere-voyage-pliable$/);
});

test('2. recherche et filtres', async ({ page }) => {
  await page.goto('/');
  const search = page.locator('.header-search').getByRole('combobox');
  await search.fill('argan');
  await expect(page.getByRole('option', { name: /Huile d’argan/ })).toBeVisible();
  await search.press('Enter');
  await expect(page).toHaveURL(/boutique\?q=argan/);
  await expect(page.getByTestId('product-card').first()).toContainText('argan');

  await page.goto('/boutique');
  await expect(page.getByTestId('result-count')).toHaveText(/34 produits/);
  const total = 34;
  await page.getByRole('button', { name: 'Moins de 5 000' }).click();
  await expect(page.getByTestId('result-count')).not.toHaveText(/34 produits/);
  const filtered = Number((await page.getByTestId('result-count').textContent())!.match(/\d+/)![0]);
  expect(filtered).toBeLessThan(total);
  expect(filtered).toBeGreaterThan(0);
  await page.getByLabel('Trier par').selectOption('prix-decroissant');
  await expect(page).toHaveURL(/tri=prix-decroissant/);
  await page.getByRole('button', { name: 'Tout effacer' }).click();
  await page.goto('/boutique?q=introuvablexyz');
  await expect(page.getByTestId('empty-results')).toBeVisible();
});

test('3. sélection de variantes : prix et stock suivent l’option choisie', async ({ page }) => {
  await page.goto('/produit/eau-de-parfum-oud-royal');
  await page.getByRole('button', { name: '50 ml', exact: true }).click();
  await expect(page.getByTestId('pdp-price')).toContainText(amount(9000));
  await page.getByRole('button', { name: '100 ml', exact: true }).click();
  await expect(page.getByTestId('pdp-price')).toContainText(amount(15000));

  await page.goto('/produit/abaya-priere-brodee-nour');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /^Anthracite/ }).click();
  await expect(page.getByRole('group').filter({ hasText: 'Couleur' }).first()).toContainText('Anthracite');
  await expect(page.getByTestId('stock-note')).toBeVisible();
});

test('4-6. ajout au panier, persistance et quantités', async ({ page }) => {
  await addProduct(page, 'huile-argan-cosmetique');
  await addProduct(page, 'savon-noir-beldi', { qty: 2 });
  await expect(page.getByTestId('cart-count')).toHaveText('3');

  await page.reload();
  await expect(page.getByTestId('cart-count')).toHaveText('3');

  await page.goto('/panier');
  await expect(page.getByTestId('cart-line')).toHaveCount(2);
  await expect(page.getByTestId('cart-subtotal')).toHaveText(amount(8000 + 2 * 3000));
  const savon = page.getByTestId('cart-line').filter({ hasText: 'Savon noir' });
  await savon.getByRole('button', { name: 'Augmenter la quantité' }).click();
  await expect(page.getByTestId('cart-subtotal')).toHaveText(amount(8000 + 3 * 3000));
  await page.getByTestId('cart-line').filter({ hasText: 'argan' }).getByRole('button', { name: /Retirer/ }).click();
  await expect(page.getByTestId('cart-line')).toHaveCount(1);
  await expect(page.getByTestId('cart-subtotal')).toHaveText(amount(9000));
});

test('le stock limite la quantité (article de seconde main unique)', async ({ page }) => {
  await page.goto('/produit/jean-droit-femme');
  await page.getByRole('button', { name: '38', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Augmenter la quantité' })).toBeDisabled();
  await page.getByTestId('add-to-cart').click();
  await page.getByRole('button', { name: 'Fermer le panier' }).click();
  await expect(page.getByTestId('add-to-cart')).toBeDisabled();
});

test('favoris', async ({ page }) => {
  await page.goto('/produit/caftan-brode');
  await page.getByRole('button', { name: /Ajouter Caftan brodé aux favoris/ }).click();
  await page.goto('/favoris');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
});

test('15. erreurs : page introuvable et produit inexistant', async ({ page }) => {
  await page.goto('/page-qui-nexiste-pas');
  await expect(page.getByRole('heading', { name: 'Cette page est introuvable' })).toBeVisible();
  await page.goto('/produit/inexistant');
  await expect(page.getByRole('heading', { name: 'Cette page est introuvable' })).toBeVisible();
  await page.goto('/commande/confirmation/BY-000000-XXXX?t=00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('heading', { name: 'Commande introuvable' })).toBeVisible();
});

test('pages légales et livraison affichent les modèles et les zones', async ({ page }) => {
  await page.goto('/livraison');
  await expect(page.locator('.zone-table')).toContainText(amount(1500));
  await expect(page.locator('.prose blockquote').first()).toContainText('Modèle à faire vérifier');
  await page.goto('/mentions-legales');
  await expect(page.locator('mark.todo').first()).toBeVisible();
});

test('formulaire de contact enregistré', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.locator('#c-name-err')).toBeVisible();
  await page.getByLabel('Nom*').fill('Fatou Sow');
  await page.getByLabel('Téléphone / WhatsApp').fill('76 111 22 33');
  await page.getByLabel('Message*').fill('Bonjour, avez-vous des tapis en gros ?');
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.getByText('Message envoyé.')).toBeVisible();
});
