import { expect, type Page } from '@playwright/test';

export const ADMIN = { email: 'admin@demo.byamashop', password: 'demo-byamashop' };

export async function addProduct(page: Page, slug: string, opts: { color?: string; size?: string; qty?: number } = {}) {
  await page.goto(`/produit/${slug}`);
  if (opts.size) await page.getByRole('button', { name: opts.size, exact: true }).click();
  if (opts.color) await page.getByRole('button', { name: opts.color, exact: true }).click();
  if (opts.qty) await page.getByRole('group', { name: 'Quantité' }).getByRole('spinbutton').fill(String(opts.qty));
  await page.getByTestId('add-to-cart').click();
  await expect(page.getByTestId('cart-drawer')).toBeVisible();
  await page.getByRole('button', { name: 'Fermer le panier' }).click();
}

export async function fillCheckout(page: Page, zone = 'Dakar (centre & banlieue)', method = 'Wave') {
  await page.getByLabel('Nom complet').fill('Awa Diop');
  await page.getByLabel(/^Téléphone/).fill('77 123 45 67');
  await page.locator('.radio-card', { hasText: zone }).click();
  const address = page.getByLabel(/Adresse \/ quartier/);
  if (await address.isVisible()) await address.fill('Sacré-Cœur 3, villa 12');
  await page.locator('.radio-card', { hasText: method }).click();
  await page.locator('.terms-check input').check();
}

export async function adminLogin(page: Page) {
  await page.goto('/admin');
  await page.getByLabel('Adresse e-mail').fill(ADMIN.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
}

export const amount = (n: number) => `${n.toLocaleString('fr-FR').replace(/ /g, ' ')} FCFA`;
