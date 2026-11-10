/**
 * Génère le logo vectorisé (texte converti en tracés, aucune police requise au chargement) :
 *  public/brand/logo.svg, logo-white.svg, mark.svg, public/favicon.svg
 *
 * Identité (novembre 2026) :
 *  - Pictogramme : arche mauresque au dégradé de marque (rose → magenta → violet),
 *    monogramme « B » en serif, croissant et étoile dorés en faîte (repris du logo d'origine).
 *  - Logotype : « Byama » en Cormorant Garamond, prune profonde, et « shop » en italique magenta.
 * Polices : Cormorant Garamond (SIL Open Font License), via @fontsource (dépendance de développement).
 * L'ancien logo est conservé dans docs/original-site/assets/ et l'historique Git.
 */
import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'node:fs';

const loadFont = (p) => {
  const b = readFileSync(`node_modules/@fontsource/cormorant-garamond/files/${p}`);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const roman = loadFont('cormorant-garamond-latin-600-normal.woff');
const italic = loadFont('cormorant-garamond-latin-500-italic.woff');

const n = (v) => {
  const r = Math.round(v * 100) / 100;
  return (Object.is(r, -0) ? 0 : r).toString();
};
/** Sérialisation maison : Path.toPathData d’opentype.js 2.0 écrit parfois « NaN ». */
function toPathData(commands) {
  return commands.map((c) => {
    switch (c.type) {
      case 'M': case 'L': return `${c.type}${n(c.x)} ${n(c.y)}`;
      case 'Q': return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      case 'C': return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      case 'Z': return 'Z';
      default: throw new Error(`Commande inconnue ${c.type}`);
    }
  }).join('');
}

/**
 * Mise en page glyphe par glyphe avec crénage. Chaque lettre est convertie séparément :
 * Chaque lettre est sérialisée par toPathData() ci-dessus.
 */
function layout(font, text, x, y, size, tracking = 0) {
  const scale = size / font.unitsPerEm;
  let prev = null;
  let cx = x;
  let data = '';
  const bb = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (prev) {
      const kern = Number(font.getKerningValue(prev, g));
      if (Number.isFinite(kern)) cx += kern * scale;
    }
    const gp = g.getPath(cx, y, size);
    data += toPathData(gp.commands);
    const b = gp.getBoundingBox();
    if (Number.isFinite(b.x1)) { bb.x1 = Math.min(bb.x1, b.x1); bb.y1 = Math.min(bb.y1, b.y1); bb.x2 = Math.max(bb.x2, b.x2); bb.y2 = Math.max(bb.y2, b.y2); }
    cx += g.advanceWidth * scale + tracking * size;
    prev = g;
  }
  if (data.includes('NaN')) throw new Error(`Tracé invalide pour « ${text} »`);
  return { d: data, bb, advance: cx - x };
}

const PLUM = '#2A0F33';
const MAGENTA = '#A01BB0';

// ---------- Pictogramme (repère 0..100 × -16..118) ----------
const ARCH = 'M14 108V54C14 31 33 18 50 7C67 18 86 31 86 54V108Q86 117 77 117H23Q14 117 14 108Z';
const ARCH_IN = 'M20.5 109.5V55.5C20.5 36 36 24.5 50 15.2C64 24.5 79.5 36 79.5 55.5V109.5';
function monogram(size, baseline) {
  const probe = layout(roman, 'B', 0, 0, size).bb;
  const dx = 50 - (probe.x1 + probe.x2) / 2;
  return layout(roman, 'B', dx, baseline, size).d;
}
const B = monogram(66, 95);
const star = (cx, cy, r) =>
  `M${cx} ${cy - r}L${cx + r * 0.3} ${cy - r * 0.3}L${cx + r} ${cy}L${cx + r * 0.3} ${cy + r * 0.3}L${cx} ${cy + r}L${cx - r * 0.3} ${cy + r * 0.3}L${cx - r} ${cy}L${cx - r * 0.3} ${cy - r * 0.3}Z`;

function mark(id, { finial = true } = {}) {
  return `<defs>
    <linearGradient id="${id}a" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#FF6FB5"/><stop offset="0.5" stop-color="#C026D3"/><stop offset="1" stop-color="#7C3AED"/></linearGradient>
    <linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBCB85"/><stop offset="1" stop-color="#B7883A"/></linearGradient>
  </defs>
  <path d="${ARCH}" fill="url(#${id}a)"/>
  <path d="${ARCH_IN}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1.1" stroke-linecap="round"/>
  <path d="${B}" fill="#fff"/>${finial ? `
  <path d="M47.6 -12.5a8.6 8.6 0 1 0 7.9 13.4a6.7 6.7 0 1 1 -7.9 -13.4Z" fill="url(#${id}o)"/>
  <path d="${star(57.5, -9, 3.6)}" fill="url(#${id}o)"/>` : ''}`;
}

// ---------- Logotype ----------
const SIZE = 84;
const TRACK = 0.004;
const byama = layout(roman, 'Byama', 0, 0, SIZE, TRACK);
const shop = layout(italic, 'shop', byama.advance + SIZE * 0.012, 0, SIZE, TRACK);
const bbA = byama.bb;
const bbS = shop.bb;
const wordW = Math.max(bbA.x2, bbS.x2) - bbA.x1;

// ---------- Assemblage horizontal ----------
const H = 140;
const markScale = 0.98; // pictogramme : y -16..118 → ≈ 131 px de haut
const markTop = 4 + 16 * markScale; // décale pour que le faîte (y=-16) tombe à 4 px
const markW = 100 * markScale;
const gap = 20;
// ligne de base : centre optique du mot aligné sur le corps de l'arche (y≈62 dans le repère du pictogramme)
const xHeightMid = -SIZE * 0.22;
const baseline = markTop + 64 * markScale - xHeightMid;
const textX = markW + gap - bbA.x1;
const W = Math.ceil(markW + gap + wordW + 10);

function logo(id, white = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Byamashop">
  <title>Byamashop</title>
  <g transform="translate(0 ${markTop.toFixed(2)}) scale(${markScale})">${mark(id)}
  </g>
  <g transform="translate(${textX.toFixed(2)} ${baseline.toFixed(2)})">
    <path d="${byama.d}" fill="${white ? '#FFFFFF' : PLUM}"/>
    <path d="${shop.d}" fill="${white ? '#FFC9E3' : MAGENTA}"/>
  </g>
</svg>
`;
}

writeFileSync('public/brand/logo.svg', logo('l'));
writeFileSync('public/brand/logo-white.svg', logo('w', true));
writeFileSync('public/brand/mark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 -18 92 138" width="92" height="138" role="img" aria-label="Byamashop">${mark('m')}\n</svg>\n`);
// favicon : sans faîte, l'arche remplit le carré pour rester lisible à 16 px
writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 4 96 116">${mark('f', { finial: false })}\n</svg>\n`);
console.log(JSON.stringify({ width: W, height: H }));
