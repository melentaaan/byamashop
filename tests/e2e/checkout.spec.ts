import { expect, test } from '@playwright/test';
import { addProduct, adminLogin, amount, fillCheckout } from './helpers';

test('7-8. frais de livraison selon la zone puis commande enregistrée', async ({ page }) => {
  await addProduct(page, 'huile-argan-cosmetique'); // 8 000
  await page.goto('/commande');
  await page.locator('.radio-card', { hasText: 'Thiès / Mbour' }).click();
  await expect(page.getByTestId('checkout-delivery')).toHaveText(amount(3000));
  await expect(page.getByTestId('checkout-total')).toHaveText(amount(11000));
  await page.locator('.radio-card', { hasText: 'Retrait sur place' }).click();
  await expect(page.getByTestId('checkout-delivery')).toHaveText('Gratuit');
  await expect(page.getByLabel(/Adresse \/ quartier/)).toBeHidden();

  await fillCheckout(page, 'Pikine / Guédiawaye / Rufisque', 'Orange Money');
  await expect(page.getByTestId('checkout-total')).toHaveText(amount(10000));
  await page.getByTestId('place-order').click();
  await expect(page).toHaveURL(/\/commande\/confirmation\/BY-\d{6}-[A-Z2-9]{4}\?t=/);
  await expect(page.getByTestId('order-total')).toHaveText(amount(10000));
  await expect(page.getByTestId('payment-status')).toHaveText('Paiement en attente');
  await expect(page.getByText('il ne valide ni la commande ni le paiement')).toBeVisible();
  await expect(page.getByTestId('cart-count')).toHaveCount(0);

  // Le lien de suivi fonctionne après rechargement
  await page.reload();
  await expect(page.getByTestId('order-reference')).toBeVisible();
});

test('15. validation du formulaire de commande', async ({ page }) => {
  await addProduct(page, 'savon-noir-beldi');
  await page.goto('/commande');
  await page.getByTestId('place-order').click();
  await expect(page.locator('#name-error')).toHaveText('Indiquez votre nom complet.');
  await expect(page.locator('#phone-error')).toBeVisible();
  await expect(page.locator('#accept_terms-error')).toBeVisible();
  await expect(page).toHaveURL(/\/commande$/);
  await page.getByLabel('Nom complet').fill('Awa');
  await page.getByLabel(/^Téléphone/).fill('123');
  await page.getByTestId('place-order').click();
  await expect(page.locator('#phone-error')).toContainText('Numéro invalide');
});

test('9. pas de doublon même en cliquant plusieurs fois', async ({ page }) => {
  await addProduct(page, 'gourde-isotherme');
  await page.goto('/commande');
  await fillCheckout(page);
  const btn = page.getByTestId('place-order');
  await btn.evaluate((el: HTMLButtonElement) => { el.click(); el.click(); el.click(); });
  await expect(page).toHaveURL(/confirmation/);
  await adminLogin(page);
  await page.goto('/admin/commandes');
  await expect(page.getByTestId('admin-orders').locator('li')).toHaveCount(1);
});

test('15. stock modifié pendant la commande : le panier le signale', async ({ page }) => {
  await addProduct(page, 'theiere-marocaine');
  await adminLogin(page);
  await page.goto('/admin/produits');
  const row = page.getByTestId('admin-product-row').filter({ hasText: 'Théière marocaine' });
  await row.getByRole('button', { name: 'Stock' }).click();
  await row.getByRole('spinbutton').fill('0');
  await row.getByRole('button', { name: 'Enregistrer le stock' }).click();
  await expect(page.getByText('Stock mis à jour')).toBeVisible();
  await page.goto('/panier');
  await expect(page.getByTestId('cart-line')).toContainText('n’est plus disponible');
  await expect(page.getByRole('button', { name: 'Passer la commande' })).toBeDisabled();
});
