import { expect, test } from '@playwright/test';
import { fillCheckout } from './helpers';

test('14. navigation mobile : menu, catégorie, achat et panier', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByTestId('menu-button').click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: /Parfums/ }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/categorie\/parfums/);

  await page.getByRole('button', { name: /^Filtrer/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Filtres' });
  await sheet.getByLabel('En stock uniquement').click();
  await expect(sheet.getByLabel('En stock uniquement')).toBeChecked();
  await sheet.getByRole('button', { name: /^Voir \d+ produit/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/dispo=1/);

  await page.goto('/produit/huile-parfumee-musc-blanc');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByTestId('add-to-cart').click();
  await page.getByRole('button', { name: 'Fermer le panier' }).click();
  await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('button', { name: /Panier/ }).click();
  await expect(page.getByTestId('cart-drawer')).toBeVisible();
  await page.getByRole('button', { name: 'Passer la commande' }).click();
  await fillCheckout(page);
  await page.getByTestId('place-order').click();
  await expect(page).toHaveURL(/confirmation/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('14. administration utilisable sur téléphone', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('Adresse e-mail').fill('admin@demo.byamashop');
  await page.getByLabel('Mot de passe', { exact: true }).fill('demo-byamashop');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('button', { name: 'Menu d’administration' }).click();
  await page.getByRole('link', { name: 'Produits & stock' }).click();
  await expect(page.getByRole('heading', { name: 'Produits & stock' })).toBeVisible();
  for (const path of ['/admin', '/admin/produits', '/admin/produits/nouveau', '/admin/commandes', '/admin/reglages', '/admin/catalogue', '/admin/messages']) {
    await page.goto(path);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `débordement horizontal sur ${path}`).toBeLessThanOrEqual(0);
  }
});
