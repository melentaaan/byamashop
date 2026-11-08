/** Génère og-image.png (1200×630) et les icônes PNG à partir du logo vectoriel. Usage : node scripts/build-raster-assets.mjs */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pub = resolve('public');
const svg = (f) => 'data:image/svg+xml;base64,' + readFileSync(resolve(pub, f)).toString('base64');
const browser = await chromium.launch();

async function render(html, w, h, out) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<!doctype html><html><body style="margin:0">${html}</body></html>`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: resolve(pub, out), omitBackground: false });
  await p.close();
}

const og = `<div style="width:1200px;height:630px;display:flex;align-items:center;gap:56px;padding:0 80px;box-sizing:border-box;background:linear-gradient(140deg,#fff0f7 0%,#f6efff 60%,#ece2fb 100%);font-family:Georgia,serif;position:relative;overflow:hidden">
  <div style="flex:1;display:flex;flex-direction:column;gap:28px">
    <img src="${svg('brand/logo.svg')}" style="width:440px">
    <div style="font-size:52px;line-height:1.1;color:#2a0f33">Élégance, piété &amp; <i style="color:#c026d3">belles trouvailles</i></div>
    <div style="font:500 24px system-ui,sans-serif;color:#553060">Robes &amp; tapis de prière · Parfums · Mode · Produits du Maroc<br>Livraison partout au Sénégal</div>
  </div>
  <img src="${svg('demo/editorial/hero.svg')}" style="width:380px;height:520px;object-fit:cover;border-radius:190px 190px 24px 24px;box-shadow:0 30px 60px -20px rgba(82,31,168,.35)">
  <div style="position:absolute;left:0;right:0;bottom:0;height:8px;background:linear-gradient(90deg,#ff6fb5,#c026d3,#7c3aed)"></div>
</div>`;
await render(og, 1200, 630, 'og-image.png');
const icon = (s) => `<div style="width:${s}px;height:${s}px;display:grid;place-items:center;background:#fff"><img src="${svg('brand/mark.svg')}" style="width:${Math.round(s * 0.72)}px"></div>`;
await render(icon(180), 180, 180, 'apple-touch-icon.png');
await render(icon(192), 192, 192, 'icon-192.png');
await render(icon(512), 512, 512, 'icon-512.png');
await browser.close();
console.log('OK : og-image.png, apple-touch-icon.png, icon-192.png, icon-512.png');
