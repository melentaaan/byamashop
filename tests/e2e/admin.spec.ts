import { expect, test } from '@playwright/test';
import { addProduct, ADMIN, adminLogin, fillCheckout } from './helpers';

test('10-11. connexion administrateur et refus d’accès', async ({ page }) => {
  await page.goto('/admin/produits');
  await expect(page.getByRole('heading', { name: 'Espace de gestion' })).toBeVisible();
  await expect(page.getByTestId('admin-product-list')).toHaveCount(0);
  await page.getByLabel('Adresse e-mail').fill(ADMIN.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill('mauvais-mot-de-passe');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('alert')).toContainText('E-mail ou mot de passe incorrect');
  await adminLogin(page);
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('heading', { name: 'Espace de gestion' })).toBeVisible();
  // Une fois déconnecté, une page d'administration redemande la connexion
  await page.goto('/admin/commandes');
  await expect(page.getByRole('heading', { name: 'Espace de gestion' })).toBeVisible();
});

test('12. création puis modification d’un produit, visible sur la boutique', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/produits/nouveau');
  await page.getByLabel('Nom du produit*').fill('Voile en mousseline test');
  await expect(page.getByLabel('Adresse de la page')).toHaveValue('voile-en-mousseline-test');
  await page.getByLabel('Catégorie').selectOption({ label: 'Robes de prière' });
  await page.getByLabel('Phrase d’accroche').fill('Voile léger.');
  await page.getByLabel('Statut').selectOption('published');
  await page.getByLabel('Prix de vente (FCFA)*').fill('6500');
  await page.getByText('Créer rapidement toutes les combinaisons').click();
  await page.getByLabel(/Taille \(séparées/).fill('S, M');
  await page.getByLabel(/Couleur \(séparées/).fill('Noir');
  await page.getByRole('button', { name: 'Générer les variantes' }).click();
  await expect(page.getByTestId('variant-row')).toHaveCount(2);
  await page.getByLabel('Stock ligne 1').fill('4');
  await page.getByLabel('Stock ligne 2').fill('2');
  await page.getByTestId('save-product').click();
  await expect(page.getByText('Produit enregistré')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/produits\/[0-9a-f-]{36}$/);

  await page.goto('/produit/voile-en-mousseline-test');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Voile en mousseline test');
  await expect(page.getByTestId('pdp-price')).toContainText('6 500');

  // Modification du prix
  await page.goto('/admin/produits');
  await page.getByRole('link', { name: 'Voile en mousseline test', exact: true }).click();
  await page.getByLabel('Prix de vente (FCFA)*').fill('7000');
  await page.getByTestId('save-product').click();
  await expect(page.getByText('Produit enregistré')).toBeVisible();
  await page.goto('/produit/voile-en-mousseline-test');
  await expect(page.getByTestId('pdp-price')).toContainText('7 000');
});

test('12. validation de l’éditeur produit', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/produits/nouveau');
  await page.getByTestId('save-product').click();
  await expect(page.getByText('Le nom est obligatoire.')).toBeVisible();
});

test('13. mise à jour du stock et dépublication', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/produits');
  const row = page.getByTestId('admin-product-row').filter({ hasText: 'Gourde isotherme' });
  await row.getByRole('button', { name: 'Stock' }).click();
  await row.getByRole('spinbutton').first().fill('2');
  await row.getByRole('button', { name: 'Enregistrer le stock' }).click();
  await expect(page.getByText('Stock mis à jour')).toBeVisible();
  await page.goto('/produit/gourde-isotherme');
  await page.getByRole('button', { name: /^Violet mat/ }).click();
  await expect(page.getByTestId('stock-note')).toHaveText(/Plus que 2 en stock/);

  await page.goto('/admin/produits');
  await page.getByTestId('admin-product-row').filter({ hasText: 'Gourde isotherme' }).getByRole('button', { name: 'Retirer' }).click();
  await expect(page.getByText('Produit retiré de la boutique')).toBeVisible();
  await page.goto('/produit/gourde-isotherme');
  await expect(page.getByRole('heading', { name: 'Cette page est introuvable' })).toBeVisible();
});

test('gestion d’une commande : paiement confirmé par l’administratrice, visible par le client', async ({ page }) => {
  await addProduct(page, 'savon-noir-beldi');
  await page.goto('/commande');
  await fillCheckout(page);
  await page.getByTestId('place-order').click();
  await expect(page).toHaveURL(/confirmation/);
  const clientUrl = page.url();
  await adminLogin(page);
  await page.goto('/admin/commandes');
  await page.getByTestId('admin-orders').locator('a').first().click();
  await expect(page.getByTestId('admin-payment-status')).toHaveText('Paiement en attente');
  page.once('dialog', (d) => d.accept());
  await page.getByTestId('mark-paid').click();
  await expect(page.getByTestId('admin-payment-status')).toHaveText('Payée');
  await expect(page.locator('.timeline')).toContainText('Paiement');
  await page.goto(clientUrl);
  await expect(page.getByTestId('payment-status')).toHaveText('Payée');
  await page.goto('/admin');
  await expect(page.locator('.stat--accent')).toContainText('4 500');
});

test('réglages : frais de livraison modifiés appliqués au panier', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/reglages');
  const row = page.getByTestId('zone-row').filter({ has: page.locator('input[value="Thiès / Mbour"]') });
  await row.getByLabel('Frais de livraison en FCFA').fill('3500');
  await row.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Zone enregistrée')).toBeVisible();
  await addProduct(page, 'savon-noir-beldi');
  await page.goto('/commande');
  await page.locator('.radio-card', { hasText: 'Thiès / Mbour' }).click();
  await expect(page.getByTestId('checkout-delivery')).toHaveText('3 500 FCFA');
});

test('import CSV de produits', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/produits/import');
  const csv = 'slug;nom;categorie;prix;statut;option1;stock\nchapelet-bois;Chapelet en bois;tapis-de-priere;2500;en_ligne;;12\n';
  await page.getByTestId('csv-input').setInputFiles({ name: 'produits.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByTestId('import-preview')).toContainText('Chapelet en bois');
  await page.getByTestId('run-import').click();
  await expect(page.getByText('1 / 1 importé(s).')).toBeVisible();
  await page.goto('/produit/chapelet-bois');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chapelet en bois');
});
