/**
 * Génère le logo vectorisé (texte converti en tracés, aucune police requise) :
 *  public/brand/logo.svg, logo-white.svg, mark.svg, public/favicon.svg
 * Reprend le logo d'origine (sac, croissant & étoile, feuille, « Byama » + « shop »)
 * en l'affinant : tracés propres, dégradé harmonisé, suppression des barres décoratives.
 */
import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'node:fs';

const fontBuf = readFileSync('node_modules/@fontsource/poppins/files/poppins-latin-800-normal.woff');
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));

const SIZE = 64;
const opts = { letterSpacing: -0.02 };
const pByama = font.getPath('Byama', 0, 0, SIZE, opts);
const wByama = font.getAdvanceWidth('Byama', SIZE, opts);
const pShop = font.getPath('shop', wByama + 1, 0, SIZE, opts);
const bbA = pByama.getBoundingBox();
const bbB = pShop.getBoundingBox();
const textW = bbB.x2 - bbA.x1;

const markW = 118; // largeur réservée au pictogramme
const gap = 16;
const baseline = 96;
const tx = markW + gap - bbA.x1;
const d = (p) => p.toPathData(2);

function mark(prefix, { leaf = true } = {}) {
  return `
  <defs>
    <linearGradient id="${prefix}bag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF6FB5"/><stop offset="0.52" stop-color="#C026D3"/><stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <path d="M40 40c0-17 9-26 21-26s21 9 21 26" fill="none" stroke="#7C3AED" stroke-width="7.5" stroke-linecap="round"/>
  <rect x="16" y="36" width="90" height="92" rx="22" fill="url(#${prefix}bag)"/>
  <circle cx="58" cy="83" r="25" fill="#fff"/>
  <circle cx="69" cy="76.5" r="22" fill="url(#${prefix}bag)"/>
  <path d="m78.5 69.5 3.2 6.6 7.3 1-5.3 5.1 1.3 7.2-6.5-3.4-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z" fill="#fff"/>
  ${leaf ? `<path d="M98 30c15-10 28-1 22.5 13.5C106.5 47.5 97.5 40.5 98 30Z" fill="#1E9E5A"/>
  <path d="M100.5 32.5c7 1.8 12.5 5.6 16.5 10" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>` : ''}`;
}

const W = Math.ceil(markW + gap + textW + 6);
const H = 140;

function logo(prefix, white = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Byamashop">
  <title>Byamashop</title>${mark(prefix)}
  <defs>
    <linearGradient id="${prefix}txt" gradientUnits="userSpaceOnUse" x1="${(bbA.x1).toFixed(1)}" y1="0" x2="${(bbA.x2).toFixed(1)}" y2="0">
      <stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#C026D3"/>
    </linearGradient>
  </defs>
  <g transform="translate(${tx.toFixed(2)} ${baseline})">
    <path d="${d(pByama)}" fill="${white ? '#fff' : `url(#${prefix}txt)`}"/>
    <path d="${d(pShop)}" fill="${white ? '#FFC9E3' : '#E0246F'}"/>
  </g>
</svg>
`;
}

writeFileSync('public/brand/logo.svg', logo('l'));
writeFileSync('public/brand/logo-white.svg', logo('w', true));
const markSvg = (p) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 6 120 128" width="120" height="128" role="img" aria-label="Byamashop">${mark(p)}\n</svg>\n`;
writeFileSync('public/brand/mark.svg', markSvg('m'));
writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 120 124">${mark('f')}\n</svg>\n`);
console.log('logo', W, 'x', H);
