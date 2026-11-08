#!/usr/bin/env node
/**
 * Planche contact des illustrations de démo + validation XML dans Chromium.
 *
 * Usage :
 *   node scripts/demo-art-contact-sheet.mjs [dossier-sortie] [fichier.svg ...]
 *
 * - écrit <sortie>/contact-sheet.html (toutes les images en grille)
 * - capture <sortie>/sheet-<section>.png (une planche par section)
 * - capture en taille réelle chaque fichier passé en argument (<sortie>/full-<nom>.png)
 * - vérifie que chaque SVG s'analyse sans erreur dans Chromium.
 *
 * Playwright doit être installé globalement (NODE_PATH=$(npm root -g) si besoin).
 */
import { readdirSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  const { execSync } = await import('node:child_process');
  const root = execSync('npm root -g').toString().trim();
  ({ chromium } = require(join(root, 'playwright')));
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEMO = join(ROOT, 'public', 'demo');
const OUT = process.argv[2] || join(tmpdir(), 'byamashop-contact-sheet');
const singles = process.argv.slice(3);
mkdirSync(OUT, { recursive: true });

const sections = {};
for (const dir of ['editorial', 'categories', 'products']) {
  const files = readdirSync(join(DEMO, dir)).filter((f) => f.endsWith('.svg')).sort();
  if (dir === 'products') {
    // une planche par tranche de 8 produits (24 images)
    const slugs = [...new Set(files.map((f) => f.replace(/-\d\.svg$/, '')))];
    for (let i = 0; i < slugs.length; i += 8) {
      const part = slugs.slice(i, i + 8);
      sections[`products-${i / 8 + 1}`] = files.filter((f) => part.includes(f.replace(/-\d\.svg$/, ''))).map((f) => `${dir}/${f}`);
    }
  } else sections[dir] = files.map((f) => `${dir}/${f}`);
}

const page = (title, files, cols) => `<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>body{margin:0;padding:16px;background:#1d1420;font:12px system-ui;color:#eee}
.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px}
figure{margin:0}img{width:100%;display:block;background:#fff}figcaption{padding:3px 0 0;opacity:.8;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}</style>
<div class="g">${files.map((f) => `<figure><img src="${pathToFileURL(join(DEMO, f)).href}"><figcaption>${f}</figcaption></figure>`).join('')}</div>`;

const all = Object.values(sections).flat();
writeFileSync(join(OUT, 'contact-sheet.html'), page('Byamashop — planche contact', all, 6));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const pg = await ctx.newPage();

// Validation : chaque SVG doit s'analyser sans erreur
let bad = 0;
for (const f of all) {
  await pg.goto(pathToFileURL(join(DEMO, f)).href);
  const err = await pg.evaluate(() => {
    const e = document.querySelector('parsererror');
    return e ? e.textContent : document.documentElement.nodeName === 'svg' ? null : 'racine non SVG';
  });
  if (err) { bad++; console.log('ERREUR XML', f, err.slice(0, 200)); }
}
console.log(`${all.length} SVG vérifiés, ${bad} en erreur.`);

for (const [name, files] of Object.entries(sections)) {
  const cols = name === 'editorial' ? 4 : 6;
  const html = join(OUT, `sheet-${name}.html`);
  writeFileSync(html, page(name, files, cols));
  await pg.setViewportSize({ width: 1600, height: 1000 });
  await pg.goto(pathToFileURL(html).href);
  await pg.waitForLoadState('load');
  await pg.screenshot({ path: join(OUT, `sheet-${name}.png`), fullPage: true });
}

for (const f of singles) {
  const file = f.endsWith('.svg') ? f : `${f}.svg`;
  const path = join(DEMO, file);
  if (!existsSync(path)) { console.log('Introuvable :', file); continue; }
  const m = readFileSync(path, 'utf8').match(/viewBox="0 0 (\d+) (\d+)"/);
  const [w, h] = m ? [+m[1], +m[2]] : [800, 1000];
  await pg.setViewportSize({ width: w, height: h });
  const tmp = join(OUT, '_single.html');
  writeFileSync(tmp, `<!doctype html><style>body{margin:0}</style><img src="${pathToFileURL(path).href}" width="${w}" height="${h}">`);
  await pg.goto(pathToFileURL(tmp).href);
  await pg.waitForLoadState('load');
  await pg.waitForTimeout(100);
  await pg.screenshot({ path: join(OUT, `full-${basename(file, '.svg')}.png`) });
}
await browser.close();
console.log('Planches écrites dans', OUT);
