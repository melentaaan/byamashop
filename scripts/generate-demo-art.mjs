#!/usr/bin/env node
/**
 * Byamashop — générateur des illustrations de démonstration (SVG).
 *
 * Produit des natures mortes vectorielles « éditoriales » (placeholders
 * premium en attendant les vraies photos) :
 *   public/demo/products/<slug>-{1,2,3}.svg   (800x1000)
 *   public/demo/categories/<slug>.svg         (800x1000)
 *   public/demo/editorial/{hero,story,wholesale,promo}.svg
 *
 * Usage : node scripts/generate-demo-art.mjs
 * Aucune dépendance, sortie déterministe.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'demo');

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */
const n = (v) => {
  const a = Math.abs(v);
  return a < 10 ? +v.toFixed(2) : +v.toFixed(1);
};
/** Gabarit qui arrondit les nombres interpolés. */
const s = (str, ...vals) =>
  str.reduce((acc, t, i) => acc + t + (i < vals.length ? (typeof vals[i] === 'number' ? n(vals[i]) : vals[i]) : ''), '');

const PLUM = '#2A0F33';
const GOLD = '#D9B26B';
const GOLD_D = '#A9803F';
const hx = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => {
  const A = hx(a), B = hx(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
const L = (c, t) => mix(c, '#ffffff', t);
const D = (c, t) => mix(c, PLUM, t);

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
let rand = () => 0.5;
function seed(str) {
  let a = hash(str);
  rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rr = (a, b) => a + (b - a) * rand();

/** Contexte par fichier : définitions (dégradés, filtres…) à ID uniques. */
class Ctx {
  constructor(prefix) {
    this.p = prefix;
    this.k = 0;
    this.defs = [];
    this.memo = new Map();
  }
  id() {
    return this.p + (this.k++).toString(36);
  }
  def(key, make) {
    if (this.memo.has(key)) return this.memo.get(key);
    const id = this.id();
    this.defs.push(make(id));
    this.memo.set(key, id);
    return id;
  }
  stops(st) {
    return st
      .map(([o, col, a]) => `<stop offset="${+o.toFixed(3)}" stop-color="${col}"${a != null && a !== 1 ? ` stop-opacity="${+a.toFixed(3)}"` : ''}/>`)
      .join('');
  }
  lin(st, x1 = 0, y1 = 0, x2 = 1, y2 = 0) {
    const id = this.def('L' + JSON.stringify([st, x1, y1, x2, y2]), (id) =>
      `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${this.stops(st)}</linearGradient>`);
    return `url(#${id})`;
  }
  rad(st, cx = 0.5, cy = 0.5, r = 0.5) {
    const id = this.def('R' + JSON.stringify([st, cx, cy, r]), (id) =>
      `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${this.stops(st)}</radialGradient>`);
    return `url(#${id})`;
  }
  blur(sd) {
    sd = Math.max(0.5, Math.round(sd * 2) / 2);
    const id = this.def('B' + sd, (id) =>
      `<filter id="${id}" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
    return `url(#${id})`;
  }
  /** Ombre portée : silhouette teintée prune, floutée. */
  sil(sd, op = 0.25, col = PLUM) {
    sd = Math.max(0.5, Math.round(sd * 2) / 2);
    const id = this.def('S' + [sd, op, col], (id) =>
      `<filter id="${id}" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feFlood flood-color="${col}" flood-opacity="${op}"/><feComposite in2="SourceAlpha" operator="in"/><feGaussianBlur stdDeviation="${sd}"/></filter>`);
    return `url(#${id})`;
  }
  pat(key, w, h, body, extra = '') {
    const id = this.def('P' + key, (id) =>
      `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}>${body}</pattern>`);
    return `url(#${id})`;
  }
  /** Définit un chemin réutilisable, renvoie son id. */
  shape(d) {
    return this.def('D' + d, (id) => `<path id="${id}" d="${d}"/>`);
  }
  clipUse(shapeId) {
    const id = this.def('C' + shapeId, (id) => `<clipPath id="${id}"><use href="#${shapeId}"/></clipPath>`);
    return `url(#${id})`;
  }
  clip(body) {
    const id = this.def('K' + body, (id) => `<clipPath id="${id}">${body}</clipPath>`);
    return `url(#${id})`;
  }
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function svgDoc(c, w, h, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><defs>${c.defs.join('')}</defs>${body}</svg>\n`;
}
const place = (x, y, sc, body, rot = 0) =>
  s`<g transform="translate(${x} ${y})${rot ? s` rotate(${rot})` : ''}${sc !== 1 ? s` scale(${sc})` : ''}">` + body + '</g>';

/* Volumes : lumière en haut à gauche, ombres vers le prune. */
const vol = (c, col, k = 0.3) => c.lin([[0, L(col, k * 0.75)], [0.35, L(col, k * 0.2)], [0.72, col], [1, D(col, k)]]);
const volV = (c, col, k = 0.3) => c.lin([[0, L(col, k * 0.6)], [0.5, col], [1, D(col, k)]], 0, 0, 0, 1);
const metal = (c, col = GOLD) =>
  c.lin([[0, D(col, 0.35)], [0.18, L(col, 0.55)], [0.34, col], [0.6, D(col, 0.22)], [0.82, L(col, 0.3)], [1, D(col, 0.4)]]);
const SILVER = ['#7F7A8F', '#F6F4FA', '#CBC7D7', '#958FA6', '#ECE9F3', '#B2ADC2', '#77718A'];
const chrome = (c) => c.lin(SILVER.map((col, i) => [i / (SILVER.length - 1), col]));

/* ------------------------------------------------------------------ */
/* Décor : fond, niche en arc, sol, lumière                            */
/* ------------------------------------------------------------------ */
const TINTS = {
  lilac: { w0: '#F7F2FF', w1: '#E7DCFA', f0: '#E2D3F6', f1: '#CDB9EA', niche: '#DDCEF5' },
  blush: { w0: '#FFF6FA', w1: '#FAE1EC', f0: '#F4D6E3', f1: '#E7BFD1', niche: '#F3D2E1' },
  warm: { w0: '#FDF9F6', w1: '#F3E8E4', f0: '#ECDED8', f1: '#DECAC2', niche: '#EBDCD6' },
  mauve: { w0: '#F1E9FB', w1: '#DCCCF0', f0: '#D4C1EA', f1: '#BEA6DA', niche: '#CFBBE7' },
  rose: { w0: '#FDF0F6', w1: '#F2D7E6', f0: '#EACADB', f1: '#DAB0C7', niche: '#EDCADC' },
};

function archPath(type, x0, x1, top, bottom) {
  const w = x1 - x0, cx = (x0 + x1) / 2;
  if (type === 'round') {
    const sy = top + w / 2;
    return s`M${x0} ${bottom}V${sy}A${w / 2} ${w / 2} 0 0 1 ${x1} ${sy}V${bottom}Z`;
  }
  if (type === 'horseshoe') {
    const R = (w / 2) * 1.1, h0 = Math.sqrt(R * R - (w / 2) ** 2), sy = top + R + h0;
    return s`M${x0} ${bottom}V${sy}A${R} ${R} 0 1 1 ${x1} ${sy}V${bottom}Z`;
  }
  // pointed (arc brisé)
  const R = w * 0.64, dx = w / 2 - R, sy = top + Math.sqrt(R * R - dx * dx);
  return s`M${x0} ${bottom}V${sy}A${R} ${R} 0 0 1 ${cx} ${top}A${R} ${R} 0 0 1 ${x1} ${sy}V${bottom}Z`;
}

function backdrop(c, o = {}) {
  const { W = 800, H = 1000, tint = 'lilac', arch = 'horseshoe', ax = W / 2, aw = 470, atop = 90, floorY = 790, patch = true, patchX = 0.66 } = o;
  const t = TINTS[tint];
  let b = '';
  b += s`<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="${c.lin([[0, t.w0], [1, t.w1]], 0, 0, 0, 1)}"/>`;
  b += s`<ellipse cx="${W * 0.2}" cy="${H * 0.08}" rx="${W * 0.8}" ry="${H * 0.6}" fill="${c.rad([[0, '#fff', 0.8], [1, '#fff', 0]])}"/>`;
  if (patch) {
    // tache de lumière d'une fenêtre en arc projetée sur le mur
    const px = W * patchX, pw = W * 0.2;
    b += s`<path d="${archPath('round', px, px + pw, H * 0.06, H * 0.42)}" transform="skewX(-14)" fill="#fff" opacity=".42" filter="${c.blur(W * 0.022)}"/>`;
  }
  if (arch !== 'none') {
    const x0 = ax - aw / 2, x1 = ax + aw / 2;
    b += s`<path d="${archPath(arch, x0 - 18, x1 + 18, atop - 18, floorY)}" fill="${L(t.w1, 0.5)}"/>`;
    b += s`<path d="${archPath(arch, x0 - 18, x1 + 18, atop - 18, floorY)}" fill="none" stroke="${PLUM}" stroke-opacity=".07" stroke-width="2"/>`;
    const d = archPath(arch, x0, x1, atop, floorY);
    const sid = c.shape(d);
    b += s`<use href="#${sid}" fill="${c.lin([[0, D(t.niche, 0.12)], [0.4, t.niche], [1, L(t.niche, 0.25)]])}"/>`;
    b += s`<g clip-path="${c.clipUse(sid)}"><use href="#${sid}" fill="none" stroke="${PLUM}" stroke-opacity=".2" stroke-width="34" filter="${c.blur(16)}" transform="translate(-8 -6)"/>`;
    b += s`<ellipse cx="${ax + aw * 0.15}" cy="${floorY - 80}" rx="${aw * 0.55}" ry="${(floorY - atop) * 0.4}" fill="${c.rad([[0, '#fff', 0.35], [1, '#fff', 0]])}"/></g>`;
  }
  b += s`<rect x="-600" y="${floorY}" width="${W + 1200}" height="${H - floorY + 600}" fill="${c.lin([[0, t.f0], [1, t.f1]], 0, 0, 0, 1)}"/>`;
  b += s`<ellipse cx="${W * 0.42}" cy="${floorY + (H - floorY) * 0.45}" rx="${W * 0.55}" ry="${(H - floorY) * 0.55}" fill="${c.rad([[0, '#fff', 0.38], [1, '#fff', 0]])}"/>`;
  b += s`<rect x="-600" y="${floorY - 4}" width="${W + 1200}" height="10" fill="${PLUM}" opacity=".09" filter="${c.blur(5)}"/>`;
  b += s`<rect x="-600" y="${floorY}" width="${W + 1200}" height="1.5" fill="#fff" opacity=".5"/>`;
  return b;
}
const vignette = (c, W = 800, H = 1000) =>
  s`<rect width="${W}" height="${H}" fill="${c.rad([[0.6, PLUM, 0], [1, PLUM, 0.13]], 0.5, 0.45, 0.78)}" pointer-events="none"/>`;

/** Ombre de contact au sol, centrée en (cx,cy). */
function contact(c, cx, cy, rx, op = 0.32) {
  return (
    s`<ellipse cx="${cx + rx * 0.12}" cy="${cy}" rx="${rx * 1.35}" ry="${rx * 0.17}" fill="${PLUM}" opacity="${op * 0.5}" filter="${c.blur(rx * 0.1)}"/>` +
    s`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.065}" fill="${PLUM}" opacity="${op}" filter="${c.blur(Math.max(2, rx * 0.035))}"/>`
  );
}
/** Ombre projetée au sol (lumière haut-gauche) d'un groupe d'id donné, base locale y=0. */
const floorCast = (c, id, op = 0.18, k = 0.55, sy = 0.2) =>
  s`<use href="#${id}" transform="matrix(1 0 ${-k} ${sy} 0 0)" filter="${c.sil(9, op)}"/>`;
const wallCast = (c, id, dx = 26, dy = 18, op = 0.22) =>
  s`<use href="#${id}" transform="translate(${dx} ${dy})" filter="${c.sil(14, op)}"/>`;

function softLines(c, lines, col, w, op) {
  if (!lines.length) return '';
  return s`<g fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}" filter="${c.blur(w * 0.55)}">` + lines.map((d) => `<path d="${d}"/>`).join('') + '</g>';
}

/* ------------------------------------------------------------------ */
/* Tissus & vêtements                                                  */
/* ------------------------------------------------------------------ */
function hanger(c, w = 236) {
  const gold = c.lin([[0, '#F6E7BE'], [0.45, GOLD], [1, '#8E6A2E']], 0, 0, 1, 1);
  return (
    s`<circle cx="4" cy="4" r="12" fill="${PLUM}" opacity=".2" filter="${c.blur(3)}"/>` +
    s`<circle r="10" fill="${c.rad([[0, '#FCF2D6'], [0.5, GOLD], [1, '#80602A']], 0.35, 0.32, 0.7)}"/>` +
    s`<path d="M${-w / 2} 108Q${-w / 4} 96 -12 72Q0 64 12 72Q${w / 4} 96 ${w / 2} 108" fill="none" stroke="${gold}" stroke-width="7" stroke-linecap="round"/>` +
    s`<path d="M${-w / 2 + 6} 108H${w / 2 - 6}" stroke="${GOLD_D}" stroke-width="3"/>` +
    s`<path d="M0 70V24C0 8-13 6-13-4C-13-15-3-18 6-13" fill="none" stroke="${gold}" stroke-width="4.5" stroke-linecap="round"/>`
  );
}

/** Ourlet ondulé échantillonné, de xa vers xb. */
function hemOf(cx, w1, y1, nw, a, bow) {
  const xl = cx - w1 / 2, step = w1 / nw;
  const hy = (x) => {
    const u = (x - cx) / (w1 / 2);
    return y1 + bow * (1 - u * u) + a * (0.7 + 0.5 * Math.sin(x * 0.041 + 1.3)) * Math.sin((2 * Math.PI * (x - xl)) / step);
  };
  const path = (xa, xb) => {
    let d = '';
    const dir = xb > xa ? 1 : -1;
    for (let x = xa; dir > 0 ? x < xb : x > xb; x += 6 * dir) d += s`L${x} ${hy(x)}`;
    return d + s`L${xb} ${hy(xb)}`;
  };
  const troughs = [], crests = [];
  for (let k = 0; k < nw; k++) {
    troughs.push(xl + step * (k + 0.75));
    crests.push(xl + step * (k + 0.25));
  }
  return { hy, path, troughs, crests };
}

/** Pan de tissu en cloche (jupe, cape, robe) : renvoie {d, folds, lights, hem}. */
function bell(o) {
  const { cx = 0, y0, w0, y1, w1, nw = 6, a = 6, bow = 16, flare = 0.3, top = null } = o;
  const H = y1 - y0, hem = hemOf(cx, w1, y1, nw, a, bow);
  const xl0 = cx - w0 / 2, xr0 = cx + w0 / 2, xl1 = cx - w1 / 2, xr1 = cx + w1 / 2;
  let d = s`M${xl0} ${y0}C${xl0 - (w1 - w0) * 0.15} ${y0 + H * flare} ${xl1} ${y1 - H * 0.35} ${xl1} ${hem.hy(xl1)}`;
  d += hem.path(xl1 + 6, xr1);
  d += s`C${xr1} ${y1 - H * 0.35} ${xr0 + (w1 - w0) * 0.15} ${y0 + H * flare} ${xr0} ${y0}`;
  d += (top || s`L${xl0} ${y0}`) + 'Z';
  const fold = (x) => {
    const xt = cx + (x - cx) * (w0 / w1) * 0.8;
    return s`M${xt} ${y0 + H * 0.1}Q${cx + (x - cx) * 0.75} ${y0 + H * 0.6} ${x} ${hem.hy(x) - 3}`;
  };
  return { d, folds: hem.troughs.map(fold), lights: hem.crests.map(fold), hem };
}

/** Rend une forme de tissu ombrée (volume + plis doux + motif optionnel). */
function cloth(c, d, col, { folds = [], lights = [], fw = 16, pat = null, k = 0.3, extra = '' } = {}) {
  const id = c.shape(d);
  let o = s`<use href="#${id}" fill="${vol(c, col, k)}"/>`;
  if (pat) o += s`<use href="#${id}" fill="${pat}"/>`;
  o += s`<g clip-path="${c.clipUse(id)}">`;
  o += softLines(c, folds.filter((_, i) => i % 2 === 0), D(col, 0.6), fw, 0.42);
  o += softLines(c, folds.filter((_, i) => i % 2 === 1), D(col, 0.55), fw * 0.6, 0.3);
  o += softLines(c, lights.filter((_, i) => i % 3 !== 1), L(col, 0.6), fw * 0.6, 0.4);
  o += extra + '</g>';
  return o;
}

/** Texture de tissage fine (visible en gros plan). */
const weave = (c, col, op = 0.18) =>
  c.pat('wv' + col + op, 6, 6, s`<path d="M0 3H6M3 0V6" stroke="${col}" stroke-width=".6" opacity="${op * 0.6}"/>`);

/** Motif wax : cercles concentriques, demi-lunes, points. */
function waxPat(c, [base, c1, c2, c3], sc = 1, rot = 0) {
  const u = 64;
  const body =
    s`<rect width="${u}" height="${u}" fill="${base}"/>` +
    s`<circle cx="16" cy="16" r="13" fill="${c1}"/><circle cx="16" cy="16" r="8.5" fill="${c3}"/><circle cx="16" cy="16" r="4.5" fill="${c2}"/>` +
    s`<circle cx="48" cy="48" r="13" fill="${c2}"/><circle cx="48" cy="48" r="8.5" fill="${c1}"/><circle cx="48" cy="48" r="3.5" fill="${c3}"/>` +
    s`<path d="M36 16a12 12 0 0 1 24 0Z" fill="${c3}"/><path d="M40 16a8 8 0 0 1 16 0Z" fill="${c2}"/>` +
    s`<path d="M4 48a12 12 0 0 0 24 0Z" fill="${c3}"/><path d="M8 48a8 8 0 0 0 16 0Z" fill="${c1}"/>` +
    s`<g fill="${c3}"><circle cx="48" cy="28" r="2"/><circle cx="16" cy="36" r="2"/><circle cx="32" cy="32" r="2.6"/><circle cx="0" cy="32" r="2"/><circle cx="64" cy="32" r="2"/></g>`;
  return c.pat('wax' + base + c1 + sc + rot, u, u, body, s` patternTransform="rotate(${rot}) scale(${sc})"`);
}

/** Motif floral (robe d'été). */
function floralPat(c, [base, f1, f2, leaf]) {
  const fl = (x, y, r, col) => {
    let p = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 * Math.PI) / 180;
      p += s`<ellipse cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r}" rx="${r * 0.85}" ry="${r * 0.6}" transform="rotate(${i * 72} ${x + Math.cos(a) * r} ${y + Math.sin(a) * r})" fill="${col}"/>`;
    }
    return p + s`<circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="${GOLD}"/>`;
  };
  const body =
    s`<rect width="70" height="70" fill="${base}"/>` +
    s`<g fill="${leaf}" opacity=".8"><ellipse cx="28" cy="20" rx="7" ry="2.6" transform="rotate(-30 28 20)"/><ellipse cx="56" cy="60" rx="7" ry="2.6" transform="rotate(40 56 60)"/><ellipse cx="6" cy="52" rx="6" ry="2.4" transform="rotate(-60 6 52)"/></g>` +
    fl(16, 14, 5, f1) + fl(48, 44, 6, f2) + fl(12, 58, 3.6, f2) + fl(60, 12, 3.4, f1);
  return c.pat('flo' + base + f1, 70, 70, body);
}

/** Points de broderie le long d'une polyligne. */
function embroidery(pts, col, gap = 9, r = 1.8, leaf = true) {
  let o = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.floor(len / gap));
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    for (let k = 0; k < steps; k++) {
      const t = k / steps, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (leaf && k % 2) o += s`<ellipse cx="${x}" cy="${y}" rx="${r * 2}" ry="${r * 0.9}" transform="rotate(${ang + 50} ${x} ${y})"/>`;
      else o += s`<circle cx="${x}" cy="${y}" r="${r}"/>`;
    }
  }
  return `<g fill="${col}">${o}</g>`;
}

/** Robe de prière deux pièces (khimar à capuche + jupe) sur cintre. Origine : patère. */
function prayerDress(c, col, { lace = false, len = 1 } = {}) {
  const gid = c.id();
  const skirt = bell({ y0: 300, w0: 210, y1: 600 * len, w1: 380, nw: 7, a: 6, bow: 16 });
  const hw = 214, cl = 445 * len, ky = (f) => 190 + (cl - 190) * f;
  const hem = hemOf(0, hw * 2, cl, 8, 7, 22);
  const kd =
    s`M-70 116C-74 78 -42 56 0 56C42 56 74 78 70 116C${hw * 0.5} 122 ${hw * 0.68} 146 ${hw * 0.74} 190C${hw * 0.86} ${ky(0.4)} ${hw * 0.98} ${ky(0.75)} ${hw} ${hem.hy(hw)}` +
    hem.path(hw - 6, -hw) +
    s`C${-hw * 0.98} ${ky(0.75)} ${-hw * 0.86} ${ky(0.4)} ${-hw * 0.74} 190C${-hw * 0.68} 146 ${-hw * 0.5} 122 -60 116Z`;
  const kf = hem.troughs.map((x) => s`M${x * 0.35} 170Q${x * 0.8} ${ky(0.5)} ${x} ${hem.hy(x) - 3}`);
  const kl = hem.crests.map((x) => s`M${x * 0.35} 160Q${x * 0.8} ${ky(0.5)} ${x} ${hem.hy(x) - 3}`);
  const sk = D(col, 0.07);
  let o = `<g id="${gid}">`;
  o += hanger(c);
  o += cloth(c, skirt.d, sk, { folds: skirt.folds, lights: skirt.lights, pat: weave(c, D(sk, 0.4), 0.12) });
  o += s`<path d="M${-190} ${skirt.hem.hy(-190) - 12}${skirt.hem.path(-184, 190).replace(/L([-\d.]+) ([-\d.]+)/g, (m, x, y) => s`L${+x} ${+y - 12}`)}" fill="none" stroke="${L(sk, 0.45)}" stroke-width="1.4" stroke-dasharray="5 4" opacity=".7"/>`;
  if (lace) o += laceRow(c, skirt.hem, -188, 188, '#FFFDF8');
  o += cloth(c, kd, col, { folds: kf, lights: kl, fw: 18, pat: weave(c, D(col, 0.4), 0.12) });
  if (lace) o += laceRow(c, hem, -hw + 4, hw - 4, '#FFFDF8');
  // ouverture du visage (capuche)
  o += hood(c, col, lace);
  o += '</g>';
  return wallCast(c, gid) + o;
}
/** Capuche repliée : bord avant en arc, sans ouverture sombre. */
function hood(c, col, lace = false) {
  const edge = 'M-62 122C-64 86 -36 68 0 68C36 68 64 86 62 122';
  return s`<path d="M-62 122C-64 86 -36 68 0 68C36 68 64 86 62 122C40 114 -40 114 -62 122Z" fill="${c.lin([[0, D(col, 0.14)], [1, col, 0]], 0, 0, 0, 1)}"/>` +
    s`<path d="${edge}" fill="none" stroke="${D(col, 0.3)}" stroke-width="7" opacity=".45" filter="${c.blur(3)}" transform="translate(3 4)"/>` +
    s`<path d="${edge}" fill="none" stroke="${L(col, 0.3)}" stroke-width="7" stroke-linecap="round"/>` +
    s`<path d="M-56 120C-58 90 -32 76 0 76C32 76 58 90 56 120" fill="none" stroke="${L(col, 0.55)}" stroke-width="1.2" stroke-dasharray="3 3"/>` +
    s`<path d="M0 68V56" stroke="${D(col, 0.2)}" stroke-width="1.4" opacity=".6"/>` +
    (lace ? s`<path d="${edge}" fill="none" stroke="#FFFDF8" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round" transform="translate(0 -4)"/>` : '');
}
function laceRow(c, hem, xa, xb, col) {
  let o = '';
  for (let x = xa; x <= xb; x += 9) o += s`<circle cx="${x}" cy="${hem.hy(x) + 1}" r="4.6"/>`;
  return s`<g fill="${col}" stroke="${D(col, 0.15)}" stroke-width=".6">${o}</g>` +
    s`<path d="M${xa} ${hem.hy(xa) - 3}${hem.path(xa + 6, xb).replace(/L([-\d.]+) ([-\d.]+)/g, (m, x, y) => s`L${+x} ${+y - 3}`)}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="1 3" stroke-linecap="round"/>`;
}

/** Jilbab une pièce à capuche, long. */
function jilbab(c, col) {
  const gid = c.id();
  const hw = 200, cl = 620, ky = (f) => 190 + (cl - 190) * f;
  const hem = hemOf(0, hw * 2, cl, 8, 6, 18);
  const d =
    s`M-70 116C-74 78 -42 56 0 56C42 56 74 78 70 116C${hw * 0.5} 122 ${hw * 0.66} 146 ${hw * 0.7} 190C${hw * 0.8} ${ky(0.4)} ${hw * 0.97} ${ky(0.75)} ${hw} ${hem.hy(hw)}` +
    hem.path(hw - 6, -hw) +
    s`C${-hw * 0.97} ${ky(0.75)} ${-hw * 0.8} ${ky(0.4)} ${-hw * 0.7} 190C${-hw * 0.66} 146 ${-hw * 0.5} 122 -60 116Z`;
  const f = hem.troughs.map((x) => s`M${x * 0.3} 170Q${x * 0.75} ${ky(0.45)} ${x} ${hem.hy(x) - 3}`);
  const l = hem.crests.map((x) => s`M${x * 0.3} 165Q${x * 0.75} ${ky(0.45)} ${x} ${hem.hy(x) - 3}`);
  let o = `<g id="${gid}">` + hanger(c);
  const sleeves =
    s`<path d="M-118 300Q-100 330 -70 336" fill="none" stroke="${D(col, 0.35)}" stroke-width="2.4" opacity=".6"/><path d="M118 300Q100 330 70 336" fill="none" stroke="${D(col, 0.35)}" stroke-width="2.4" opacity=".6"/>` +
    s`<path d="M0 150V${cl + 10}" stroke="${D(col, 0.3)}" stroke-width="1.6" opacity=".45"/>`;
  o += cloth(c, d, col, { folds: f, lights: l, fw: 18, pat: weave(c, D(col, 0.4), 0.12), extra: sleeves });
  o += hood(c, col);
  return wallCast(c, gid) + o + '</g>';
}

/** Manches pendantes (pour robes / tuniques / vestes). */
function sleevePath(side, { y0 = 116, y1 = 470, wTop = 46, wBot = 52, out = 22 } = {}) {
  const sx = side;
  const x0 = 104 * sx;
  return s`M${x0} ${y0}C${x0 + 30 * sx} ${y0 + 4} ${x0 + 44 * sx} ${y0 + 30} ${x0 + (wTop + 6) * sx} ${y0 + 60}L${x0 + (wTop + out) * sx} ${y1}Q${x0 + (wTop + out - wBot / 2) * sx} ${y1 + 8} ${x0 + (wTop + out - wBot) * sx} ${y1}L${x0} ${y0 + 90}Z`;
}

/** Abaya brodée. */
function abaya(c, col, emb = GOLD) {
  const gid = c.id();
  const body = bell({ y0: 112, w0: 206, y1: 650, w1: 330, nw: 6, a: 5, bow: 14, flare: 0.25, top: s`L82 106Q40 98 26 98Q0 118 -26 98Q-40 98 -82 106` });
  let o = `<g id="${gid}">` + hanger(c);
  for (const sd of [-1, 1]) {
    const sp = sleevePath(sd, { y1: 480 });
    o += cloth(c, sp, D(col, 0.08), { fw: 10 });
    const cx = (104 + 46 + 22 - 26) * sd;
    o += s`<g clip-path="${c.clip(`<path d="${sp}"/>`)}"><rect x="${cx - 40}" y="438" width="80" height="34" fill="${D(col, 0.25)}"/>` +
      embroidery([[cx - 34, 444], [cx + 34, 444]], emb, 7, 1.5, false) + embroidery([[cx - 34, 456], [cx + 34, 456]], emb, 9, 1.8) + embroidery([[cx - 34, 467], [cx + 34, 467]], emb, 7, 1.5, false) + '</g>';
  }
  o += cloth(c, body.d, col, { folds: body.folds, lights: body.lights, fw: 14, pat: weave(c, L(col, 0.3), 0.08) });
  // encolure + broderies
  o += s`<path d="M-26 98Q0 128 26 98Q0 108 -26 98Z" fill="${D(col, 0.45)}"/>`;
  o += embroidery([[-34, 100], [-22, 116], [-8, 124], [8, 124], [22, 116], [34, 100]], emb, 6, 1.6, false);
  o += embroidery([[0, 132], [0, 300]], emb, 10, 2);
  o += embroidery([[-6, 140], [-6, 280]], emb, 8, 1.1, false) + embroidery([[6, 140], [6, 280]], emb, 8, 1.1, false);
  o += s`<g clip-path="${c.clipUse(c.shape(body.d))}">` + embroidery([[-170, 632], [170, 632]], emb, 10, 2) + embroidery([[-170, 620], [170, 620]], emb, 7, 1.2, false) + '</g>';
  return wallCast(c, gid) + o + '</g>';
}

/** Tunique brodée + pantalon. */
function tunicSet(c, col, emb = GOLD) {
  const gid = c.id();
  const pc = D(col, 0.18);
  let o = `<g id="${gid}">` + hanger(c);
  // pantalon (deux jambes larges) derrière
  o += cloth(c, s`M-98 360L-112 640Q-80 648 -48 640L-6 380L6 380L48 640Q80 648 112 640L98 360Z`, pc, {
    folds: [s`M-60 400L-70 630`, s`M60 400L70 630`, s`M0 380L0 420`], lights: [s`M-90 420L-98 630`, s`M30 420L40 630`], fw: 10,
  });
  for (const sd of [-1, 1]) o += cloth(c, sleevePath(sd, { y1: 450, wBot: 46 }), D(col, 0.06), { fw: 10 });
  const body = bell({ y0: 112, w0: 206, y1: 500, w1: 262, nw: 5, a: 3, bow: 8, flare: 0.25, top: s`L82 106Q40 98 26 98Q0 118 -26 98Q-40 98 -82 106` });
  o += cloth(c, body.d, col, { folds: body.folds, lights: body.lights, fw: 12, pat: weave(c, L(col, 0.3), 0.1) });
  // fentes latérales
  o += s`<path d="M-128 ${body.hem.hy(-128)}L-122 440M128 ${body.hem.hy(128)}L122 440" stroke="${D(col, 0.4)}" stroke-width="2"/>`;
  // col en V brodé
  o += s`<path d="M-26 98L0 170L26 98Q0 112 -26 98Z" fill="${D(col, 0.45)}"/>`;
  o += embroidery([[-36, 98], [0, 184], [36, 98]], emb, 7, 1.8);
  o += embroidery([[-48, 100], [0, 204], [48, 100]], L(emb, 0.4), 6, 1.2, false);
  o += embroidery([[0, 204], [0, 300]], emb, 9, 1.8);
  for (const sd of [-1, 1]) {
    const cx = (104 + 46 + 22 - 23) * sd;
    o += embroidery([[cx - 26, 430], [cx + 26, 430]], emb, 8, 1.5);
  }
  return wallCast(c, gid) + o + '</g>';
}

/** Caftan brodé avec sfifa et boutons (aakad). */
function caftan(c, col) {
  const gid = c.id();
  let o = `<g id="${gid}">` + hanger(c);
  for (const sd of [-1, 1]) {
    const x0 = 104 * sd;
    const sp = s`M${x0} 116C${x0 + 34 * sd} 120 ${x0 + 50 * sd} 150 ${x0 + 56 * sd} 180L${x0 + 104 * sd} 470Q${x0 + 60 * sd} 486 ${x0 + 12 * sd} 470L${x0} 220Z`;
    o += cloth(c, sp, D(col, 0.08), { fw: 12, folds: [s`M${x0 + 30 * sd} 200L${x0 + 56 * sd} 465`] });
    o += s`<path d="M${x0 + 104 * sd} 470Q${x0 + 60 * sd} 486 ${x0 + 12 * sd} 470" fill="none" stroke="${GOLD}" stroke-width="7"/>`;
    o += s`<path d="M${x0 + 102 * sd} 456Q${x0 + 60 * sd} 472 ${x0 + 14 * sd} 456" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="2 3"/>`;
  }
  const body = bell({ y0: 112, w0: 206, y1: 650, w1: 360, nw: 6, a: 5, bow: 14, flare: 0.25, top: s`L82 106Q40 96 22 96L-22 96Q-40 96 -82 106` });
  const sheen = s`<path d="M-120 140L-20 650" stroke="#fff" stroke-width="40" opacity=".08" filter="${c.blur(18)}"/>`;
  o += cloth(c, body.d, col, { folds: body.folds, lights: body.lights, fw: 15, k: 0.38, extra: sheen });
  // sfifa centrale
  const braid = c.pat('braid', 8, 8, s`<rect width="8" height="8" fill="${GOLD}"/><path d="M0 8L8 0" stroke="${GOLD_D}" stroke-width="1.6"/>`);
  const by = body.hem.hy(0);
  o += s`<rect x="-9" y="96" width="18" height="${by - 96}" fill="${braid}"/><path d="M-9 96V${by}M9 96V${by}" stroke="${L(GOLD, 0.4)}" stroke-width="1.2"/>`;
  let btn = '';
  for (let y = 124; y < 360; y += 15) btn += s`<circle cx="-15" cy="${y}" r="3.6"/><circle cx="15" cy="${y}" r="3.6"/>`;
  o += s`<g fill="${c.rad([[0, '#FBF1D4'], [0.6, GOLD], [1, GOLD_D]], 0.35, 0.3, 0.7)}">${btn}</g>`;
  o += s`<path d="M-22 96Q0 104 22 96L22 104Q0 112 -22 104Z" fill="${GOLD}"/>`;
  o += s`<g clip-path="${c.clipUse(c.shape(body.d))}"><path d="M-200 ${by - 14}${body.hem.path(-194, 200).replace(/L([-\d.]+) ([-\d.]+)/g, (m, x, y) => s`L${+x} ${+y - 10}`)}" fill="none" stroke="${GOLD}" stroke-width="6"/></g>`;
  return wallCast(c, gid) + o + '</g>';
}

/** Veste en jean sur cintre. */
function denimJacket(c, col, stitch = '#E3A75C') {
  const gid = c.id();
  const st = (d, w = 1.3) => s`<path d="${d}" fill="none" stroke="${stitch}" stroke-width="${w}" stroke-dasharray="3 2.4"/>`;
  const twill = c.pat('tw' + col, 5, 5, s`<path d="M0 5L5 0M-1 1L1 -1M4 6L6 4" stroke="${L(col, 0.35)}" stroke-width=".8" opacity=".35"/>`);
  let o = `<g id="${gid}">` + hanger(c, 250);
  for (const sd of [-1, 1]) {
    const x0 = 112 * sd;
    const sp = s`M${x0} 116C${x0 + 30 * sd} 120 ${x0 + 44 * sd} 146 ${x0 + 48 * sd} 180L${x0 + 60 * sd} 440L${x0 + 8 * sd} 446L${x0} 220Z`;
    o += cloth(c, sp, D(col, 0.1), { pat: twill, fw: 9, folds: [s`M${x0 + 26 * sd} 200L${x0 + 36 * sd} 420`] });
    o += s`<path d="M${x0 + 58 * sd} 410L${x0 + 6 * sd} 416L${x0 + 8 * sd} 446L${x0 + 60 * sd} 440Z" fill="${D(col, 0.18)}"/>`;
    o += st(s`M${x0 + 57 * sd} 414L${x0 + 7 * sd} 420`);
  }
  const bd = s`M-112 112Q-120 300 -114 430L114 430Q120 300 112 112L60 100Q0 112 -60 100Z`;
  o += cloth(c, bd, col, { pat: twill, fw: 12, folds: [s`M-60 250L-66 420`, s`M60 250L66 420`], lights: [s`M-90 160L-96 410`] });
  o += s`<rect x="-114" y="398" width="228" height="32" fill="${D(col, 0.12)}"/>`;
  o += st('M-112 403H112') + st('M-112 425H112');
  // empiècement
  o += st('M-112 150Q0 166 112 150') + st('M-112 155Q0 171 112 155');
  // poches poitrine
  for (const sd of [-1, 1]) {
    const px = 58 * sd;
    o += s`<path d="M${px - 30} 190H${px + 30}V214L${px} 226L${px - 30} 214Z" fill="${D(col, 0.08)}" stroke="${D(col, 0.3)}" stroke-width="1"/>`;
    o += st(s`M${px - 26} 194H${px + 26}V212L${px} 222L${px - 26} 212Z`);
    o += s`<circle cx="${px}" cy="214" r="4.5" fill="${metal(c, '#C9894A')}"/>`;
    o += st(s`M${px - 26} 232V300M${px + 26} 232V300`) + st(s`M${px - 30} 236V398M${px + 30} 236V398`, 1);
  }
  // patte de boutonnage
  o += s`<path d="M2 116V398" stroke="${D(col, 0.4)}" stroke-width="1.6"/>` + st('M-6 120V398');
  for (let y = 150; y < 400; y += 52) o += s`<circle cx="-8" cy="${y}" r="5" fill="${metal(c, '#C9894A')}"/><circle cx="-8" cy="${y}" r="2" fill="${D('#C9894A', 0.5)}"/>`;
  o += s`<circle cx="-8" cy="414" r="5" fill="${metal(c, '#C9894A')}"/>`;
  // col
  for (const sd of [-1, 1]) {
    o += s`<path d="M${4 * sd} 104L${-62 * sd} 98L${-84 * sd} 116L${-60 * sd} 170L${-14 * sd} 132Z" fill="${vol(c, D(col, 0.04))}" stroke="${D(col, 0.35)}" stroke-width="1"/>`;
    o += st(s`M${-58 * sd} 104L${-76 * sd} 118L${-58 * sd} 160L${-18 * sd} 130`);
  }
  return wallCast(c, gid) + o + '</g>';
}

/** Robe d'été fleurie. */
function summerDress(c, col, flowers) {
  const gid = c.id();
  const pat = floralPat(c, [col, ...flowers]);
  let o = `<g id="${gid}">` + hanger(c);
  const sk = bell({ y0: 290, w0: 150, y1: 650, w1: 400, nw: 7, a: 7, bow: 16, flare: 0.15 });
  const bodice = s`M-40 102L-92 116L-122 168Q-100 182 -80 176L-76 296L76 296L80 176Q100 182 122 168L92 116L40 102Q0 190 -40 102Z`;
  o += cloth(c, sk.d, col, { folds: sk.folds, lights: sk.lights, pat, fw: 18 });
  o += cloth(c, bodice, col, { pat, folds: [s`M-30 200L-36 290`, s`M40 210L44 290`], fw: 8 });
  o += s`<path d="M-40 102Q0 190 40 102" fill="none" stroke="${D(col, 0.25)}" stroke-width="2"/>`;
  // ceinture nouée
  o += s`<path d="M-78 282Q0 292 78 282L78 302Q0 312 -78 302Z" fill="${vol(c, D(col, 0.08))}"/><path d="M-78 282Q0 292 78 282L78 302Q0 312 -78 302Z" fill="${pat}" opacity=".7"/>`;
  o += s`<path d="M52 300C60 340 50 380 58 420L70 418C64 380 74 340 64 300Z" fill="${vol(c, col)}"/><path d="M62 300C76 330 84 370 98 404L108 398C96 366 86 330 72 300Z" fill="${vol(c, D(col, 0.06))}"/>`;
  o += s`<ellipse cx="62" cy="298" rx="12" ry="9" fill="${vol(c, col)}"/>`;
  return wallCast(c, gid) + o + '</g>';
}

/** Ensemble wax deux pièces (haut péplum + jupe). */
function waxSet(c, cols) {
  const gid = c.id();
  const pTop = waxPat(c, cols, 0.9, 0), pSk = waxPat(c, cols, 1.1, 30);
  let o = `<g id="${gid}">` + hanger(c);
  const sk = bell({ y0: 300, w0: 210, y1: 650, w1: 290, nw: 5, a: 4, bow: 10, flare: 0.2 });
  o += cloth(c, sk.d, cols[0], { folds: sk.folds, lights: sk.lights, pat: pSk, fw: 16 });
  o += s`<rect x="-105" y="296" width="210" height="20" fill="${pSk}"/><rect x="-105" y="296" width="210" height="20" fill="${PLUM}" opacity=".12"/>`;
  const top = s`M-44 100L-102 112L-150 178Q-128 196 -108 190L-100 280Q-120 320 -132 350Q0 372 132 350Q120 320 100 280L108 190Q128 196 150 178L102 112L44 100Q0 140 -44 100Z`;
  o += cloth(c, top, cols[0], { pat: pTop, folds: [s`M-60 290L-90 345`, s`M0 296L0 360`, s`M60 290L90 345`], lights: [s`M-30 290L-46 352`, s`M30 290L46 352`], fw: 12 });
  o += s`<path d="M-100 280Q0 296 100 280" fill="none" stroke="${PLUM}" stroke-width="3" opacity=".25"/>`;
  o += s`<path d="M-44 100Q0 140 44 100" fill="none" stroke="${cols[2]}" stroke-width="6"/>`;
  return wallCast(c, gid) + o + '</g>';
}

/* ------------------------------------------------------------------ */
/* Objets posés : piles pliées, tapis, boîtes                          */
/* ------------------------------------------------------------------ */
/** Pile pliée vue de face + dessus. Origine : bas-centre. `top` est dessiné dans le repère (0..w, 0..d) du dessus. */
function foldStack(c, { w, h, d, k = 0.55, col, layers = 3, r = 14, top = '', sideCol = null, edge = '', soft = true }) {
  const dh = d * k, x0 = -w / 2;
  const sc = sideCol || col;
  let o = s`<g transform="translate(${x0} ${-h - dh}) scale(1 ${k})">`;
  o += s`<rect width="${w}" height="${d + r}" rx="${r}" fill="${c.lin([[0, L(col, 0.08)], [0.6, L(col, 0.22)], [1, L(col, 0.12)]], 0, 0, 0.5, 1)}"/>`;
  o += top + '</g>';
  const fr = s`M${x0} ${-h + 2}Q${x0} ${-h} ${x0 + 6} ${-h}H${w / 2 - 6}Q${w / 2} ${-h} ${w / 2} ${-h + 2}V${-r * 0.5}Q${w / 2} 0 ${w / 2 - r} 0H${x0 + r}Q${x0} 0 ${x0} ${-r * 0.5}Z`;
  o += s`<path d="${fr}" fill="${c.lin([[0, L(sc, 0.1)], [0.25, sc], [1, D(sc, 0.3)]], 0, 0, 0, 1)}"/>`;
  o += s`<path d="${fr}" fill="${c.lin([[0, '#fff', 0.14], [0.45, '#fff', 0], [1, PLUM, 0.16]])}"/>`;
  if (soft) {
    const lh = h / layers;
    o += s`<path d="${fr}" fill="${D(sc, 0.35)}"/>`;
    for (let i = 0; i < layers; i++) {
      const y = -h + i * lh, inset = i % 2 ? 3 : 0;
      o += s`<rect x="${x0 + inset}" y="${y}" width="${w - inset * 2}" height="${lh + 0.5}" rx="${lh / 2}" fill="${c.lin([[0, L(sc, 0.3)], [0.35, sc], [1, D(sc, 0.32)]], 0, 0, 0, 1)}"/>`;
    }
    o += s`<path d="${fr}" fill="${c.lin([[0, '#fff', 0.12], [0.4, '#fff', 0], [1, PLUM, 0.14]])}"/>`;
    o += edge;
    return o;
  }
  o += edge;
  for (let i = 1; i < layers; i++) {
    const y = -h + (h * i) / layers;
    o += s`<path d="M${x0 + 3} ${y}Q0 ${y + 3} ${w / 2 - 3} ${y}" fill="none" stroke="${D(sc, 0.5)}" stroke-width="1.4" opacity=".55"/>`;
    o += s`<path d="M${x0 + 3} ${y + 2}Q0 ${y + 5} ${w / 2 - 3} ${y + 2}" fill="none" stroke="${L(sc, 0.4)}" stroke-width="1" opacity=".5"/>`;
  }
  o += s`<path d="M${x0 + 8} ${-h + 1}H${w / 2 - 8}" stroke="${L(col, 0.55)}" stroke-width="2" opacity=".8"/>`;
  return o;
}
const stackShadow = (c, w, op = 0.3) => contact(c, 0, 0, w * 0.52, op);

function star8(cx, cy, r) {
  let p = '';
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2, rad = i % 2 ? r * 0.62 : r;
    p += (i ? 'L' : 'M') + n(cx + Math.cos(a) * rad) + ' ' + n(cy + Math.sin(a) * rad);
  }
  return p + 'Z';
}
function star5(cx, cy, r) {
  let p = '';
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, rad = i % 2 ? r * 0.45 : r;
    p += (i ? 'L' : 'M') + n(cx + Math.cos(a) * rad) + ' ' + n(cy + Math.sin(a) * rad);
  }
  return p + 'Z';
}

const rugBorder = (c, acc, gold = GOLD) =>
  c.pat('rb' + acc + gold, 24, 24,
    s`<path d="M12 5L19 12L12 19L5 12Z" fill="${acc}" opacity=".9"/><circle cx="12" cy="12" r="2.4" fill="${gold}"/><path d="M0 0L4 0L0 4ZM24 24L20 24L24 20ZM24 0L24 4L20 0ZM0 24L0 20L4 24Z" fill="${gold}" opacity=".8"/>`);
/** Dessin d'un tapis de prière (repère 0..w x 0..h, haut = côté qibla). */
function rugArt(c, { w, h, col, acc, gold = GOLD, motif = 'mihrab', quilt = false }) {
  let o = s`<rect width="${w}" height="${h}" rx="3" fill="${c.lin([[0, L(col, 0.14)], [0.5, col], [1, D(col, 0.2)]], 0, 0, 1, 1)}"/>`;
  const b0 = w * 0.045, b1 = w * 0.15;
  const band = s`M${b0} ${b0}H${w - b0}V${h - b0}H${b0}ZM${b1} ${b1}V${h - b1}H${w - b1}V${b1}Z`;
  const bp = rugBorder(c, acc, gold);
  o += s`<path d="${band}" fill="${D(col, 0.32)}"/><path d="${band}" fill="${bp}"/>`;
  o += s`<rect x="${b0}" y="${b0}" width="${w - 2 * b0}" height="${h - 2 * b0}" fill="none" stroke="${gold}" stroke-width="1.8"/>`;
  o += s`<rect x="${b1}" y="${b1}" width="${w - 2 * b1}" height="${h - 2 * b1}" fill="none" stroke="${gold}" stroke-width="1.8"/>`;
  o += s`<rect x="${b1 + 5}" y="${b1 + 5}" width="${w - 2 * b1 - 10}" height="${h - 2 * b1 - 10}" fill="none" stroke="${acc}" stroke-width="1" stroke-dasharray="2 4" opacity=".8"/>`;
  if (motif === 'mihrab') {
    const ax0 = b1 + w * 0.09, ax1 = w - b1 - w * 0.09, top = b1 + h * 0.05, bot = h - b1 - h * 0.15;
    o += s`<path d="${archPath('pointed', ax0, ax1, top, bot)}" fill="${mix(col, acc, 0.22)}" stroke="${gold}" stroke-width="2.4"/>`;
    o += s`<path d="${archPath('pointed', ax0 + 9, ax1 - 9, top + 12, bot - 8)}" fill="none" stroke="${acc}" stroke-width="1.2" stroke-dasharray="1.5 3.5"/>`;
    const sy = top + (ax1 - ax0) * 0.62;
    for (const x of [ax0 + 14, ax1 - 22]) {
      o += s`<rect x="${x}" y="${sy}" width="8" height="${bot - sy - 10}" fill="${gold}" opacity=".55"/><rect x="${x - 3}" y="${sy - 6}" width="14" height="6" fill="${gold}"/><rect x="${x - 3}" y="${bot - 14}" width="14" height="6" fill="${gold}"/>`;
    }
    const cx = w / 2;
    o += s`<path d="M${cx} ${top + 6}V${top + 50}" stroke="${gold}" stroke-width="1.2"/>`;
    o += s`<path d="M${cx} ${top + 50}L${cx + 11} ${top + 66}L${cx} ${top + 92}L${cx - 11} ${top + 66}Z" fill="${gold}"/><circle cx="${cx}" cy="${top + 69}" r="3.4" fill="${D(col, 0.3)}"/>`;
    o += s`<path d="${star8(cx, (sy + bot) / 2 + 10, w * 0.1)}" fill="none" stroke="${gold}" stroke-width="1.8"/><path d="${star8(cx, (sy + bot) / 2 + 10, w * 0.05)}" fill="${acc}"/>`;
    // écoinçons
    for (const x of [b1 + 16, w - b1 - 16]) o += s`<g fill="${acc}" opacity=".85"><circle cx="${x}" cy="${b1 + 18}" r="4"/><circle cx="${x}" cy="${b1 + 32}" r="2.4"/><circle cx="${x + (x < cx ? 12 : -12)}" cy="${b1 + 20}" r="2.4"/></g>`;
    // panneau bas
    const py = bot + 10, ph = h - b1 - 8 - py;
    o += s`<rect x="${b1 + 12}" y="${py}" width="${w - 2 * b1 - 24}" height="${ph}" fill="none" stroke="${gold}" stroke-width="1.2"/>`;
    for (let i = 0; i < 3; i++) {
      const x = w / 2 + (i - 1) * (w - 2 * b1) * 0.28;
      o += s`<path d="M${x} ${py + 4}L${x + ph * 0.45} ${py + ph / 2}L${x} ${py + ph - 4}L${x - ph * 0.45} ${py + ph / 2}Z" fill="${acc}" opacity=".85"/>`;
    }
  } else if (motif === 'stars') {
    const cx = w / 2;
    o += s`<path d="M${cx + 22} ${b1 + 36}a34 34 0 1 0 0 56a26 26 0 1 1 0 -56Z" fill="${acc}"/>`;
    seed('stars' + w + h + col);
    for (let i = 0; i < 9; i++) {
      const x = b1 + 22 + rand() * (w - 2 * b1 - 44), y = b1 + 120 + rand() * (h - 2 * b1 - 150);
      o += s`<path d="${star5(x, y, rr(6, 11))}" fill="${i % 2 ? acc : '#fff'}" opacity=".9"/>`;
    }
  }
  if (quilt) {
    o += s`<rect x="${b1}" y="${b1}" width="${w - 2 * b1}" height="${h - 2 * b1}" fill="${c.pat('q' + col, 34, 34, s`<path d="M0 0L34 34M34 0L0 34" stroke="${D(col, 0.45)}" stroke-width="1.6" stroke-dasharray="3 2"/>`)}" opacity=".7"/>`;
  }
  // reflet du velours
  o += s`<rect width="${w}" height="${h}" fill="${c.lin([[0, '#fff', 0], [0.28, '#fff', 0.1], [0.42, '#fff', 0], [0.7, '#fff', 0.06], [1, '#fff', 0]], 0, 0, 1, 1)}"/>`;
  return o;
}
function fringe(x0, x1, y, len, col, dy = 1, step = 4.5) {
  let d = '';
  for (let x = x0; x <= x1; x += step) d += s`M${x} ${y}l${rr(-1.5, 1.5)} ${(len + rr(-4, 4)) * dy}`;
  return s`<path d="${d}" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;
}

/** Tapis suspendu à une tringle. Origine : centre de la tringle. */
function rugHanging(c, o) {
  const { w = 300, h = 500, col } = o;
  seed('rh' + col + w);
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<rect x="${-w / 2 - 44}" y="-7" width="${w + 88}" height="14" rx="7" fill="${c.lin([[0, '#FBF0D2'], [0.4, GOLD], [1, '#80602A']], 0, 0, 0, 1)}"/>`;
  for (const x of [-w / 2 - 50, w / 2 + 50]) g += s`<circle cx="${x}" cy="0" r="12" fill="${c.rad([[0, '#FCF2D6'], [0.5, GOLD], [1, '#80602A']], 0.35, 0.32, 0.7)}"/>`;
  for (const x of [-w / 2 - 22, w / 2 + 22]) g += s`<rect x="${x - 4}" y="-30" width="8" height="26" rx="3" fill="${GOLD_D}"/>`;
  g += s`<path d="M${-w / 2} 8V-12Q${-w / 2} -24 ${-w / 2 + 12} -24H${w / 2 - 12}Q${w / 2} -24 ${w / 2} -12V8Z" fill="${D(col, 0.35)}"/>`;
  g += s`<g transform="translate(${-w / 2} 4)">` + rugArt(c, { ...o, w, h }) + '</g>';
  g += s`<rect x="${-w / 2}" y="4" width="${w}" height="18" fill="${c.lin([[0, L(col, 0.35), 0.7], [1, col, 0]], 0, 0, 0, 1)}"/>`;
  g += fringe(-w / 2 + 6, w / 2 - 6, h + 4, 26, L(o.acc, 0.6));
  return wallCast(c, gid, 22, 16, 0.24) + g + '</g>';
}

/** Tapis posé au sol en perspective, extrémité roulée. Origine : centre du bord avant. */
function rugFloor(c, o) {
  const { w = 300, h = 520, col, roll = 0.32, kx = 0.4, ky = 0.36 } = o;
  seed('rf' + col + w);
  const gid = c.id();
  const vr = h * roll, m = s`matrix(1 0 ${-kx * ky} ${ky} ${-w / 2 + kx * ky * h} ${-ky * h})`;
  let g = `<g id="${gid}">`;
  g += s`<g transform="${m}"><g clip-path="${c.clip(s`<rect y="${vr}" width="${w}" height="${h}"/>`)}">` + rugArt(c, { ...o, w, h }) + '</g></g>';
  const Yf = -(h - vr) * ky, R = 30, xl = -w / 2 + kx * ky * (h - vr);
  // rouleau
  if (roll > 0) {
  g += s`<rect x="${xl}" y="${Yf - 2 * R}" width="${w}" height="${2 * R}" fill="${c.lin([[0, L(col, 0.25)], [0.35, col], [0.85, D(col, 0.35)], [1, D(col, 0.5)]], 0, 0, 0, 1)}"/>`;
  g += s`<rect x="${xl}" y="${Yf - 2 * R + 8}" width="${w}" height="10" fill="${D(col, 0.35)}" opacity=".7"/>`;
  g += s`<rect x="${xl}" y="${Yf - 2 * R + 10}" width="${w}" height="5" fill="${rugBorder(c, o.acc, o.gold)}" opacity=".9"/>`;
  g += s`<ellipse cx="${xl + w}" cy="${Yf - R}" rx="${R * 0.42}" ry="${R}" fill="${D(col, 0.25)}"/>`;
  let sp = '';
  for (let i = 1; i <= 4; i++) sp += s`<ellipse cx="${xl + w}" cy="${Yf - R + i * 1.5}" rx="${R * 0.42 * (1 - i * 0.2)}" ry="${R * (1 - i * 0.2)}"/>`;
  g += s`<g fill="none" stroke="${D(col, 0.55)}" stroke-width="1.2">${sp}</g>`;
  } else g += s`<g transform="translate(${xl} ${Yf})">` + fringe(4, w - 4, 0, -14, L(o.acc, 0.6)) + '</g>';
  g += fringe(-w / 2 + 4, w / 2 - 4, 0, 18, L(o.acc, 0.6));
  return floorCast(c, gid, 0.14, 0.3, 0.1) + contact(c, kx * ky * h * 0.3, -h * ky * 0.3, w * 0.6, 0.12) + g + '</g>';
}

/** Chapelet (tasbih) posé à plat. Origine : centre de la boucle. */
function tasbih(c, { rx = 80, ry = 24, count = 33, r = 6.5, col = '#EADBC4', tassel = GOLD } = {}) {
  const beadF = c.rad([[0, L(col, 0.75)], [0.45, col], [1, D(col, 0.4)]], 0.35, 0.3, 0.75);
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.PI / 2;
    pts.push([Math.cos(a) * rx, Math.sin(a) * ry * (1 + 0.15 * Math.sin(a * 2))]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  let o = s`<ellipse cx="6" cy="${ry + 8}" rx="${rx * 1.1}" ry="${ry * 0.6}" fill="${PLUM}" opacity=".16" filter="${c.blur(6)}"/>`;
  o += `<g fill="${beadF}">`;
  for (const [x, y] of pts) o += s`<circle cx="${x}" cy="${y}" r="${r * (0.88 + 0.12 * (y / ry + 1) / 2)}"/>`;
  o += s`<circle cx="6" cy="${ry + 10}" r="${r * 1.3}"/><ellipse cx="14" cy="${ry + 26}" rx="${r * 0.9}" ry="${r * 1.5}" transform="rotate(-25 14 ${ry + 26})"/></g>`;
  let t = '';
  for (let i = 0; i < 9; i++) t += s`M18 ${ry + 34}q${8 + i * 2} ${18} ${4 + i * 4} ${34 + (i % 3) * 3}`;
  o += s`<path d="${t}" fill="none" stroke="${tassel}" stroke-width="1.6" stroke-linecap="round"/>`;
  o += s`<rect x="12" y="${ry + 32}" width="12" height="8" rx="3" fill="${D(tassel, 0.15)}" transform="rotate(-25 18 ${ry + 36})"/>`;
  return o;
}

/** Podium cylindrique. Origine : bas-centre. */
function podium(c, { rx = 150, h = 80, col = '#EFE6F7' } = {}) {
  const ry = rx * 0.2;
  return (
    contact(c, 0, 0, rx * 1.02, 0.28) +
    s`<path d="M${-rx} ${-h}V0A${rx} ${ry} 0 0 0 ${rx} 0V${-h}Z" fill="${vol(c, col, 0.25)}"/>` +
    s`<ellipse cx="0" cy="${-h}" rx="${rx}" ry="${ry}" fill="${c.lin([[0, L(col, 0.55)], [1, L(col, 0.15)]], 0, 0, 0.6, 1)}"/>` +
    s`<ellipse cx="0" cy="${-h}" rx="${rx - 1}" ry="${ry - 1}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>`
  );
}
/** Bloc (socle rectangulaire). Origine : bas-centre. */
function plinth(c, { w = 260, h = 120, d = 90, col = '#EADFF5' } = {}) {
  return contact(c, 0, 0, w * 0.55, 0.26) + foldStack(c, { w, h, d, k: 0.45, col, layers: 1, r: 3, soft: false });
}

/** Présentoir : socle bas + objet posé dessus (objet à l'origine du dessus). */
function onPlinth(c, x, inner, { w = 620, h = 130, d = 230, col = '#F6F0FA', y = 975 } = {}) {
  return place(x, y, 1, plinth(c, { w, h, d, col }) + place(0, -h - 14, 1, inner));
}
/** Boîte cadeau. Origine : bas-centre. */
function giftBox(c, { w = 300, h = 190, d = 200, k = 0.42, col, rib, bow = true, open = false, inside = '', lidLean = false, tissue = null }) {
  const dh = d * k, x0 = -w / 2;
  const satin = (cc) => c.lin([[0, D(cc, 0.15)], [0.3, L(cc, 0.45)], [0.5, cc], [0.75, L(cc, 0.3)], [1, D(cc, 0.25)]]);
  let o = contact(c, 0, 0, w * 0.55, 0.32);
  if (lidLean) {
    o += s`<g transform="translate(${-w * 0.08} ${-h - dh + 10}) rotate(-6)"><rect x="${x0 - 8}" y="${-d * 0.9}" width="${w + 16}" height="${d * 0.9 + 12}" rx="4" fill="${vol(c, D(col, 0.06), 0.25)}"/>` +
      (rib ? s`<rect x="-14" y="${-d * 0.9}" width="28" height="${d * 0.9 + 12}" fill="${satin(rib)}"/>` : '') + '</g>';
  }
  if (!open) {
    o += s`<g transform="translate(${x0 - 6} ${-h - dh}) scale(1 ${k})"><rect width="${w + 12}" height="${d}" rx="3" fill="${c.lin([[0, L(col, 0.12)], [1, L(col, 0.3)]], 0, 0, 0.4, 1)}"/>`;
    if (rib) o += s`<rect x="${w / 2 + 6 - 14}" width="28" height="${d}" fill="${satin(rib)}"/><rect y="${d / 2 - 14}" width="${w + 12}" height="28" fill="${satin(rib)}"/>`;
    o += '</g>';
  } else {
    o += s`<g transform="translate(${x0} ${-h - dh}) scale(1 ${k})"><rect width="${w}" height="${d}" rx="2" fill="${L(col, 0.15)}"/><rect x="8" y="8" width="${w - 16}" height="${d - 16}" fill="${c.lin([[0, D(col, 0.5)], [1, D(col, 0.3)]], 0, 0, 0, 1)}"/></g>`;
    if (tissue) {
      // papier de soie froissé : pics et creux alternés, plis fins
      const nP = 10, pk = [];
      for (let i = 0; i <= nP; i++) {
        const peak = i % 2 === 1;
        pk.push([x0 + 4 + ((w - 8) * i) / nP + (peak ? rr(-6, 6) : 0), -h - (peak ? dh * rr(0.55, 0.95) + 14 : dh * rr(0.15, 0.35))]);
      }
      let p = s`M${x0 + 2} ${-h + 2}L${pk[0][0]} ${pk[0][1]}`;
      for (let i = 0; i < nP; i++) {
        const [xa, ya] = pk[i], [xb, yb] = pk[i + 1];
        p += s`Q${(xa + xb) / 2 + 3} ${(ya + yb) / 2 - 5} ${xb} ${yb}`;
      }
      p += s`L${w / 2 - 2} ${-h + 2}Z`;
      o += s`<path d="${p}" fill="${c.lin([[0, '#fff'], [0.6, L(tissue, 0.3)], [1, tissue]], 0, 0, 0, 1)}" stroke="#fff" stroke-width="1.5"/>`;
      let fl = '';
      for (let i = 1; i < nP; i += 2) fl += s`M${pk[i][0]} ${pk[i][1] + 3}L${pk[i][0] + (i % 4 === 1 ? 10 : -8)} ${-h}`;
      o += s`<path d="${fl}" fill="none" stroke="${D(tissue, 0.3)}" stroke-width="1.2" opacity=".35"/>`;
      o += s`<path d="${p}" fill="none" stroke="${D(tissue, 0.2)}" stroke-width=".8" opacity=".3"/>`;
    }
    o += inside;
  }
  const lidH = open ? 0 : Math.min(54, h * 0.3);
  o += s`<rect x="${x0}" y="${-h + lidH}" width="${w}" height="${h - lidH}" fill="${vol(c, col, 0.28)}"/>`;
  o += s`<rect x="${x0}" y="${-h + lidH}" width="${w}" height="${h - lidH}" fill="${c.lin([[0, '#fff', 0.08], [1, PLUM, 0.1]], 0, 0, 0, 1)}"/>`;
  if (lidH) {
    o += s`<rect x="${x0 - 6}" y="${-h}" width="${w + 12}" height="${lidH}" fill="${vol(c, L(col, 0.05), 0.28)}"/>`;
    o += s`<rect x="${x0 - 6}" y="${-h + lidH}" width="${w + 12}" height="6" fill="${PLUM}" opacity=".18" filter="${c.blur(2)}"/>`;
  } else {
    o += s`<path d="M${x0} ${-h}H${w / 2}" stroke="${L(col, 0.5)}" stroke-width="2"/>`;
  }
  if (rib) o += s`<rect x="-14" y="${-h}" width="28" height="${h}" fill="${satin(rib)}"/><rect x="-14" y="${-h}" width="28" height="${h}" fill="${c.lin([[0, '#fff', 0], [1, PLUM, 0.15]], 0, 0, 0, 1)}"/>`;
  if (rib && bow && !open) o += ribbonBow(c, 0, -h - dh / 2, rib);
  return o;
}
function ribbonBow(c, x, y, rib, sc = 1) {
  const f = c.lin([[0, L(rib, 0.5)], [0.5, rib], [1, D(rib, 0.3)]], 0, 0, 1, 1);
  const fb = c.lin([[0, D(rib, 0.1)], [1, D(rib, 0.4)]], 0, 0, 1, 1);
  return place(x, y, sc,
    s`<path d="M-4 4C-30 30 -40 60 -52 84L-34 80L-26 96C-18 66 -8 36 6 8Z" fill="${fb}"/><path d="M4 4C24 30 44 52 62 70L44 72L44 90C30 60 14 34 -2 10Z" fill="${fb}"/>` +
    s`<path d="M0 0C-30 -50 -92 -46 -80 -8C-72 16 -30 12 0 2Z" fill="${f}"/><path d="M0 0C30 -50 92 -46 80 -8C72 16 30 12 0 2Z" fill="${f}"/>` +
    s`<path d="M-6 -4C-30 -30 -62 -30 -64 -12" fill="none" stroke="${D(rib, 0.35)}" stroke-width="2" opacity=".5"/><path d="M6 -4C30 -30 62 -30 64 -12" fill="none" stroke="${D(rib, 0.35)}" stroke-width="2" opacity=".5"/>` +
    s`<ellipse cx="0" cy="0" rx="14" ry="11" fill="${f}"/><path d="M-60 -20C-40 -34 -20 -24 -8 -8" fill="none" stroke="#fff" stroke-width="3" opacity=".45"/>`);
}

/* ------------------------------------------------------------------ */
/* Flacons & objets                                                    */
/* ------------------------------------------------------------------ */
const glassF = (c, tint = '#F4EEFF') => c.lin([[0, '#fff', 0.7], [0.12, tint, 0.35], [0.5, tint, 0.18], [0.88, tint, 0.3], [1, '#fff', 0.6]]);

/** Flacon carré à facettes (oud). Origine : bas-centre. */
function oudBottle(c, { liq = '#C47A1E', cap = '#2E1430', w = 220, h = 250 } = {}) {
  const gid = c.id();
  let o = s`<ellipse cx="${w * 0.45}" cy="6" rx="${w * 0.62}" ry="16" fill="${L(liq, 0.2)}" opacity=".45" filter="${c.blur(9)}"/>`;
  o += contact(c, 0, 0, w * 0.55, 0.38);
  let g = `<g id="${gid}">`;
  g += s`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="18" fill="${glassF(c, L(liq, 0.7))}"/>`;
  g += s`<rect x="${-w / 2 + 22}" y="${-h + 34}" width="${w - 44}" height="${h - 68}" rx="9" fill="${c.lin([[0, L(liq, 0.35)], [0.45, L(liq, 0.08)], [1, D(liq, 0.35)]])}"/>`;
  g += s`<rect x="${-w / 2 + 22}" y="${-h + 34}" width="${w - 44}" height="${h - 68}" rx="9" fill="${c.lin([[0, '#fff', 0.2], [0.3, '#fff', 0], [0.8, PLUM, 0], [1, PLUM, 0.25]], 0, 0, 0, 1)}"/>`;
  g += s`<ellipse cx="${-w * 0.06}" cy="${-h * 0.5}" rx="${w * 0.28}" ry="${h * 0.26}" fill="${L(liq, 0.6)}" opacity=".6" filter="${c.blur(16)}"/>`;
  g += s`<path d="M${-w / 2 + 30} ${-h + 60}L${w / 2 - 50} ${-h + 44}" stroke="#fff" stroke-width="3" opacity=".25"/>`;
  g += s`<rect x="${-w / 2 + 22}" y="${-h + 34}" width="${w - 44}" height="6" rx="3" fill="${L(liq, 0.5)}" opacity=".8"/>`;
  g += s`<rect x="${-w / 2 + 14}" y="-30" width="${w - 28}" height="22" rx="6" fill="${liq}" opacity=".35"/>`;
  g += s`<rect x="${-w / 2 + 10}" y="${-h + 14}" width="11" height="${h - 34}" rx="5.5" fill="#fff" opacity=".6"/>`;
  g += s`<rect x="${w / 2 - 15}" y="${-h + 24}" width="4" height="${h - 60}" rx="2" fill="#fff" opacity=".4"/>`;
  g += s`<rect x="${-w / 2 + 1}" y="${-h + 1}" width="${w - 2}" height="${h - 2}" rx="17" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2"/>`;
  g += s`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="18" fill="none" stroke="${D(liq, 0.4)}" stroke-opacity=".25" stroke-width="1"/>`;
  // col doré
  g += s`<rect x="-36" y="${-h - 30}" width="72" height="34" rx="4" fill="${metal(c)}"/><path d="M-36 ${-h - 20}H36M-36 ${-h - 10}H36" stroke="${GOLD_D}" stroke-width="1" opacity=".6"/>`;
  // bouchon facetté
  const cy0 = -h - 30, ch = 128, cw = 132;
  g += s`<path d="M${-cw / 2} ${cy0 - 8}L${-cw / 2} ${cy0 - ch + 14}L${-cw * 0.22} ${cy0 - ch}L${-cw * 0.22} ${cy0}Z" fill="${L(cap, 0.28)}"/>`;
  g += s`<path d="M${-cw * 0.22} ${cy0}L${-cw * 0.22} ${cy0 - ch}L${cw * 0.22} ${cy0 - ch}L${cw * 0.22} ${cy0}Z" fill="${c.lin([[0, L(cap, 0.12)], [1, cap]], 0, 0, 0, 1)}"/>`;
  g += s`<path d="M${cw * 0.22} ${cy0}L${cw * 0.22} ${cy0 - ch}L${cw / 2} ${cy0 - ch + 14}L${cw / 2} ${cy0 - 8}Z" fill="${D(cap, 0.45)}"/>`;
  g += s`<path d="M${-cw / 2} ${cy0 - ch + 14}L${-cw * 0.22} ${cy0 - ch}L${cw * 0.22} ${cy0 - ch}L${cw / 2} ${cy0 - ch + 14}L${cw * 0.22} ${cy0 - ch + 22}L${-cw * 0.22} ${cy0 - ch + 22}Z" fill="${L(cap, 0.4)}"/>`;
  g += s`<path d="M${-cw * 0.22} ${cy0 - ch + 22}V${cy0}M${cw * 0.22} ${cy0 - ch + 22}V${cy0}" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>`;
  g += s`<rect x="${-cw / 2 + 6}" y="${cy0 - ch + 26}" width="5" height="${ch - 40}" rx="2.5" fill="#fff" opacity=".35"/>`;
  return floorCast(c, gid, 0.14) + o + g + '</g>';
}

/** Flacon roll-on. Origine : bas-centre. */
function rollOn(c, { liq = '#F6EEDC', cap = GOLD, capOn = true } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<rect x="-38" y="-172" width="76" height="172" rx="16" fill="${glassF(c)}"/>`;
  g += s`<rect x="-28" y="-150" width="56" height="140" rx="10" fill="${c.lin([[0, L(liq, 0.4)], [0.5, liq], [1, D(liq, 0.18)]])}"/>`;
  g += s`<rect x="-28" y="-150" width="56" height="5" rx="2.5" fill="#fff" opacity=".7"/>`;
  g += s`<rect x="-31" y="-160" width="8" height="140" rx="4" fill="#fff" opacity=".65"/><rect x="24" y="-150" width="3" height="120" fill="#fff" opacity=".4"/>`;
  g += s`<rect x="-38" y="-172" width="76" height="172" rx="16" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>`;
  g += s`<rect x="-20" y="-190" width="40" height="20" rx="3" fill="${glassF(c)}" stroke="#fff" stroke-opacity=".7"/>`;
  if (capOn) {
    g += s`<rect x="-31" y="-282" width="62" height="96" rx="8" fill="${metal(c, cap)}"/>`;
    let ribs = '';
    for (let x = -26; x <= 26; x += 4) ribs += s`M${x} -276V-192`;
    g += s`<path d="${ribs}" stroke="${D(cap, 0.4)}" stroke-width=".8" opacity=".45"/><rect x="-31" y="-282" width="62" height="8" rx="4" fill="${L(cap, 0.5)}"/>`;
  } else {
    g += s`<rect x="-16" y="-200" width="32" height="12" rx="3" fill="#F4F1F6"/><circle cx="0" cy="-206" r="13" fill="${c.rad([[0, '#fff'], [0.6, '#E7E1EE'], [1, '#A9A0B6']], 0.35, 0.3, 0.7)}"/>`;
  }
  return floorCast(c, gid, 0.13) + contact(c, 0, 0, 46, 0.36) + g + '</g>';
}
/** Petit capuchon couché. */
function capLying(c, cap = GOLD) {
  return contact(c, 0, 0, 52, 0.3) + s`<rect x="-48" y="-62" width="96" height="62" rx="10" fill="${c.lin([[0, L(cap, 0.5)], [0.3, cap], [1, D(cap, 0.35)]], 0, 0, 0, 1)}"/>` +
    s`<ellipse cx="48" cy="-31" rx="10" ry="31" fill="${D(cap, 0.3)}"/><ellipse cx="48" cy="-31" rx="6" ry="24" fill="${D(cap, 0.6)}"/>`;
}

/** Flacon fin (coffret trio). */
function slimBottle(c, { liq, h = 230, cap = GOLD } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<rect x="-30" y="${-h}" width="60" height="${h}" rx="12" fill="${glassF(c)}"/>`;
  g += s`<rect x="-22" y="${-h + 26}" width="44" height="${h - 40}" rx="8" fill="${c.lin([[0, L(liq, 0.3)], [0.5, liq], [1, D(liq, 0.3)]])}"/>`;
  g += s`<rect x="-25" y="${-h + 10}" width="6" height="${h - 24}" rx="3" fill="#fff" opacity=".6"/>`;
  g += s`<rect x="-30" y="${-h}" width="60" height="${h}" rx="12" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/>`;
  g += s`<rect x="-12" y="${-h - 16}" width="24" height="18" fill="${metal(c, cap)}"/>`;
  g += s`<rect x="-19" y="${-h - 84}" width="38" height="70" rx="6" fill="${metal(c, cap)}"/><rect x="-19" y="${-h - 84}" width="38" height="6" rx="3" fill="${L(cap, 0.5)}"/>`;
  return floorCast(c, gid, 0.12) + contact(c, 0, 0, 36, 0.36) + g + '</g>';
}

/** Brume corporelle. */
function mistBottle(c, { col = '#FBE3D2' } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  const d = s`M-62 -14V-322C-62 -350 -48 -360 -24 -362H24C48 -360 62 -350 62 -322V-14Q62 0 48 0H-48Q-62 0 -62 -14Z`;
  g += s`<path d="${d}" fill="${vol(c, col, 0.22)}"/>`;
  g += s`<path d="${d}" fill="${c.lin([[0, '#fff', 0.35], [0.2, '#fff', 0], [1, '#fff', 0]], 0, 0, 0, 1)}"/>`;
  g += s`<rect x="-48" y="-330" width="12" height="300" rx="6" fill="#fff" opacity=".55" filter="${c.blur(3)}"/>`;
  g += s`<path d="${archPath('round', -34, 34, -250, -110)}" fill="none" stroke="${D(col, 0.18)}" stroke-width="1.4" opacity=".6"/>`;
  g += s`<rect x="-26" y="-384" width="52" height="24" rx="3" fill="${metal(c, '#E2C58E')}"/>`;
  g += s`<rect x="-22" y="-440" width="44" height="58" rx="8" fill="${vol(c, L(col, 0.5), 0.2)}"/><rect x="-22" y="-440" width="44" height="10" rx="5" fill="#fff" opacity=".8"/><circle cx="-14" cy="-418" r="3" fill="${D(col, 0.4)}"/>`;
  return floorCast(c, gid, 0.12) + contact(c, 0, 0, 70, 0.36) + g + '</g>';
}

/** Branche de fleur d'oranger. */
function blossom(c, sc = 1) {
  const leaf = c.lin([[0, '#9DBF8A'], [1, '#4E7A4A']], 0, 0, 1, 1);
  const fl = (x, y, r) => {
    let p = '';
    for (let i = 0; i < 5; i++) {
      const a = i * 72 - 90;
      p += s`<ellipse cx="${x}" cy="${y - r}" rx="${r * 0.48}" ry="${r}" transform="rotate(${a + 90} ${x} ${y})"/>`;
    }
    return s`<g fill="#FFFDF8" stroke="#EADFD6" stroke-width=".6">${p}</g><circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="#F3C25B"/>`;
  };
  return place(0, 0, sc,
    s`<path d="M0 0C30 -20 70 -30 120 -26C150 -24 180 -34 200 -50" fill="none" stroke="#6B5A3E" stroke-width="3"/>` +
    s`<g fill="${leaf}"><ellipse cx="60" cy="-36" rx="26" ry="9" transform="rotate(-30 60 -36)"/><ellipse cx="110" cy="-12" rx="24" ry="9" transform="rotate(20 110 -12)"/><ellipse cx="160" cy="-50" rx="20" ry="8" transform="rotate(-40 160 -50)"/><ellipse cx="30" cy="-4" rx="18" ry="7" transform="rotate(15 30 -4)"/></g>` +
    fl(120, -30, 13) + fl(196, -54, 11) + fl(86, -40, 9) + s`<ellipse cx="148" cy="-28" rx="6" ry="8" fill="#FFFDF8" stroke="#EADFD6"/>`);
}

/** Brûleur à encens (thiouraye). */
function incenseBurner(c, { col = '#B8643F' } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<path d="M-46 0L-34 -40H34L46 0Z" fill="${vol(c, col)}"/><rect x="-52" y="-6" width="104" height="8" rx="4" fill="${D(col, 0.2)}"/>`;
  g += s`<rect x="-22" y="-70" width="44" height="32" fill="${vol(c, D(col, 0.08))}"/>`;
  g += s`<path d="M-96 -150C-98 -100 -60 -70 0 -68C60 -70 98 -100 96 -150Z" fill="${vol(c, col)}"/>`;
  g += s`<ellipse cx="0" cy="-150" rx="98" ry="14" fill="${D(col, 0.15)}"/>`;
  g += s`<path d="M-84 -150C-84 -210 -40 -240 0 -244C40 -240 84 -210 84 -150Z" fill="${vol(c, L(col, 0.04))}"/>`;
  let holes = '';
  for (let row = 0; row < 3; row++) for (let i = -3 + (row % 2) * 0.5; i <= 3; i++) {
    const y = -170 - row * 22, x = i * (22 - row * 4);
    if (Math.abs(x) < 70 - row * 16) holes += s`<path d="M${x} ${y - 6}L${x + 4} ${y}L${x} ${y + 6}L${x - 4} ${y}Z"/>`;
  }
  g += `<g fill="${D(col, 0.55)}">${holes}</g>`;
  g += s`<path d="M-90 -118Q0 -100 90 -118" fill="none" stroke="${L(col, 0.35)}" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>`;
  g += s`<circle cx="0" cy="-252" r="12" fill="${vol(c, col)}"/>`;
  g += s`<path d="M-90 -170C-80 -210 -50 -232 -20 -238" fill="none" stroke="#fff" stroke-width="5" opacity=".25" stroke-linecap="round"/>`;
  g += '</g>';
  const smoke = s`<g fill="none" stroke="#fff" stroke-linecap="round" opacity=".75" filter="${c.blur(2.5)}"><path d="M0 -266C-20 -300 24 -330 4 -370C-14 -410 30 -440 14 -490C4 -520 26 -550 20 -580" stroke-width="5"/><path d="M-30 -200C-60 -250 -30 -290 -54 -330C-74 -370 -40 -400 -60 -450" stroke-width="3.5"/><path d="M34 -210C60 -250 40 -300 70 -340C96 -380 70 -420 92 -470" stroke-width="3"/></g>`;
  return floorCast(c, gid, 0.14) + contact(c, 0, 0, 60, 0.36) + g + smoke;
}
/** Petit sachet d'encens avec grains. */
function incensePouch(c, col = '#6D2E5C') {
  let o = contact(c, 0, 0, 62, 0.32);
  o += s`<path d="M-58 0C-66 -40 -54 -80 -36 -96L36 -96C54 -80 66 -40 58 0Z" fill="${vol(c, col)}"/>`;
  o += s`<path d="M-58 0C-66 -40 -54 -80 -36 -96L36 -96C54 -80 66 -40 58 0Z" fill="${weave(c, L(col, 0.4), 0.25)}"/>`;
  o += s`<path d="M-36 -96Q-48 -112 -40 -122Q0 -128 40 -122Q48 -112 36 -96Z" fill="${D(col, 0.15)}"/>`;
  o += s`<ellipse cx="0" cy="-114" rx="34" ry="8" fill="${D(col, 0.5)}"/>`;
  let gr = '';
  seed('grains' + col);
  for (let i = 0; i < 26; i++) gr += s`<ellipse cx="${rr(-28, 28)}" cy="${-114 + rr(-5, 4)}" rx="${rr(2.5, 4)}" ry="${rr(2, 3)}"/>`;
  for (let i = 0; i < 14; i++) gr += s`<ellipse cx="${rr(60, 120)}" cy="${rr(-6, 6)}" rx="${rr(2.5, 4)}" ry="${rr(2, 3)}"/>`;
  o += s`<g fill="${c.rad([[0, '#C99A62'], [1, '#5A3418']], 0.35, 0.35, 0.7)}">${gr}</g>`;
  o += s`<path d="M-40 -98Q0 -90 40 -98" fill="none" stroke="${GOLD}" stroke-width="2.4"/><path d="M38 -98q16 10 10 34M40 -98q24 0 26 26" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
  return o;
}

/** Flacon compte-gouttes ambré (argan). */
function dropperBottle(c, { glass = '#8A4A12', oil = '#E0A93A' } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  const d = s`M-64 -12V-196C-64 -222 -46 -232 -28 -236V-262H28V-236C46 -232 64 -222 64 -196V-12Q64 0 52 0H-52Q-64 0 -64 -12Z`;
  g += s`<path d="${d}" fill="${c.lin([[0, L(glass, 0.3)], [0.4, glass], [1, D(glass, 0.5)]])}"/>`;
  g += s`<rect x="-52" y="-168" width="104" height="158" rx="10" fill="${c.lin([[0, L(oil, 0.2)], [0.5, oil], [1, D(oil, 0.35)]])}" opacity=".55"/>`;
  g += s`<rect x="-52" y="-170" width="104" height="5" rx="2" fill="${L(oil, 0.5)}" opacity=".7"/>`;
  g += s`<rect x="-54" y="-210" width="10" height="190" rx="5" fill="#fff" opacity=".45"/><rect x="48" y="-190" width="4" height="160" fill="#fff" opacity=".25"/>`;
  g += s`<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>`;
  g += s`<rect x="-34" y="-296" width="68" height="40" rx="5" fill="${metal(c)}"/><path d="M-34 -284H34M-34 -270H34" stroke="${GOLD_D}" stroke-width="1" opacity=".5"/>`;
  g += s`<path d="M-24 -296C-26 -340 -18 -372 0 -376C18 -372 26 -340 24 -296Z" fill="${c.lin([[0, '#5B4A55'], [0.35, '#2A1C24'], [1, '#120A10']])}"/>`;
  g += s`<path d="M-14 -300C-16 -336 -10 -360 -2 -366" fill="none" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>`;
  return floorCast(c, gid, 0.14) + contact(c, 0, 0, 72, 0.38) + g + '</g>';
}
function arganNuts(c, arr) {
  let o = '';
  for (const [x, y, rot, half] of arr) {
    o += contact(c, x, y, 18, 0.3);
    o += place(x, y - 10, 1,
      s`<ellipse rx="19" ry="12" fill="${c.rad([[0, '#B9875A'], [0.6, '#7A4B28'], [1, '#4A2914']], 0.35, 0.3, 0.75)}"/><path d="M18 -2L26 0L18 3Z" fill="#5A3418"/>` +
      (half ? s`<ellipse rx="12" ry="7" fill="#F1DDB8"/><ellipse cx="-2" cy="-1" rx="7" ry="3.5" fill="#fff" opacity=".5"/>` : s`<ellipse cx="-6" cy="-4" rx="7" ry="3" fill="#fff" opacity=".22"/>`), rot);
  }
  return o;
}

/** Pot en verre (savon noir). */
function soapJar(c, { paste = '#3B3526' } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<rect x="-110" y="-150" width="220" height="150" rx="28" fill="${glassF(c)}"/>`;
  g += s`<path d="M-96 -112Q0 -96 96 -112V-40Q96 -14 70 -14H-70Q-96 -14 -96 -40Z" fill="${c.lin([[0, L(paste, 0.18)], [0.45, paste], [1, D(paste, 0.5)]])}"/>`;
  g += s`<rect x="-100" y="-140" width="12" height="118" rx="6" fill="#fff" opacity=".55"/><rect x="90" y="-130" width="4" height="96" fill="#fff" opacity=".35"/>`;
  g += s`<rect x="-110" y="-150" width="220" height="150" rx="28" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>`;
  g += s`<ellipse cx="0" cy="-150" rx="104" ry="20" fill="${L('#EDE6F2', 0.3)}" stroke="#fff" stroke-width="3"/>`;
  g += s`<ellipse cx="0" cy="-146" rx="96" ry="15" fill="${c.rad([[0, L(paste, 0.12)], [1, D(paste, 0.4)]], 0.45, 0.4, 0.7)}"/>`;
  g += s`<path d="M-50 -148C-30 -158 10 -156 30 -146C10 -140 -20 -140 -36 -146" fill="none" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
  return floorCast(c, gid, 0.14) + contact(c, 0, 0, 112, 0.36) + g + '</g>';
}
/** Coupelle en terre cuite (savon noir, variante). */
function clayDish(c, { col = '#C0714F', fill = '#3B3526' } = {}) {
  let o = contact(c, 0, 0, 130, 0.34);
  o += s`<path d="M-140 -60C-130 -14 -80 0 0 0C80 0 130 -14 140 -60Z" fill="${vol(c, col)}"/>`;
  o += s`<ellipse cx="0" cy="-60" rx="140" ry="30" fill="${L(col, 0.12)}"/>`;
  o += s`<ellipse cx="0" cy="-58" rx="124" ry="24" fill="${c.rad([[0, L(fill, 0.15)], [1, D(fill, 0.45)]], 0.45, 0.4, 0.7)}"/>`;
  o += s`<path d="M-70 -62C-40 -76 20 -74 50 -62C20 -54 -30 -54 -50 -60" fill="none" stroke="#fff" stroke-width="3.5" opacity=".3" stroke-linecap="round"/>`;
  o += s`<path d="M-128 -46Q0 -20 128 -46" fill="none" stroke="${L(col, 0.35)}" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>`;
  return o;
}
/** Gant kessa posé. */
function kessa(c, col = '#4B4450') {
  const tex = c.pat('kes' + col, 6, 6, s`<path d="M0 0L6 6M6 0L0 6" stroke="${L(col, 0.45)}" stroke-width=".8" opacity=".55"/>`);
  const d = 'M-60 -10C-70 -60 -64 -120 -40 -140C-10 -160 30 -150 46 -120C54 -100 56 -60 52 -10Z';
  const th = 'M46 -80C70 -86 90 -76 92 -60C94 -46 76 -40 54 -44Z';
  return contact(c, 0, 0, 64, 0.32) + place(0, -10, 0.85,
    s`<path d="${th}" fill="${vol(c, col)}"/><path d="${th}" fill="${tex}"/><path d="${d}" fill="${vol(c, col)}"/><path d="${d}" fill="${tex}"/>` +
    s`<path d="M-40 -130C-20 -146 20 -144 36 -120" fill="none" stroke="#fff" stroke-width="4" opacity=".25" stroke-linecap="round"/>` +
    s`<path d="M-60 -16H52V8Q-4 14 -60 8Z" fill="${D(col, 0.25)}"/><path d="M-60 -4H52" stroke="${L(col, 0.5)}" stroke-width="1.5" stroke-dasharray="4 3"/>` +
    s`<path d="M-56 -14C-80 -30 -86 -6 -66 2" fill="none" stroke="${D(col, 0.3)}" stroke-width="2.5"/>`, 10);
}

/** Bol (bois sculpté ou céramique) avec ghassoul. */
function clayBowl(c, { wood = true, col = '#8A5A3B', clay = '#C9A68C', wet = false } = {}) {
  let o = contact(c, 0, 0, 140, 0.34);
  const body = 'M-150 -110C-148 -50 -96 -18 -54 -14L-46 0H46L54 -14C96 -18 148 -50 150 -110Z';
  o += s`<path d="${body}" fill="${vol(c, col, 0.35)}"/>`;
  if (wood) {
    let gr = '';
    for (let i = 0; i < 6; i++) gr += s`M${-140 + i * 8} ${-100 + i * 2}C${-100 + i * 6} ${-40 + i * 3} ${60 - i * 4} ${-40 + i * 3} ${140 - i * 8} ${-100 + i * 2}`;
    o += s`<path d="${gr}" fill="none" stroke="${D(col, 0.4)}" stroke-width="1" opacity=".35"/>`;
    let notch = '';
    for (let x = -130; x <= 130; x += 20) notch += s`M${x} ${-104 + Math.abs(x) * 0.05}q10 14 20 0`;
    o += s`<path d="${notch}" fill="none" stroke="${D(col, 0.45)}" stroke-width="1.6" opacity=".6"/>`;
  } else {
    o += s`<path d="M-140 -80Q0 -50 140 -80" fill="none" stroke="#fff" stroke-width="3" opacity=".5"/><path d="M-130 -64Q0 -36 130 -64" fill="none" stroke="${D(col, 0.3)}" stroke-width="1.5" stroke-dasharray="2 6" opacity=".7"/>`;
  }
  o += s`<ellipse cx="0" cy="-110" rx="150" ry="30" fill="${L(col, 0.2)}"/><ellipse cx="0" cy="-108" rx="138" ry="24" fill="${D(col, 0.3)}"/>`;
  if (wet) {
    o += s`<ellipse cx="0" cy="-106" rx="134" ry="22" fill="${c.rad([[0, L(clay, 0.15)], [1, D(clay, 0.25)]], 0.4, 0.35, 0.7)}"/>`;
    o += s`<path d="M-80 -110C-40 -122 30 -122 70 -110C30 -102 -40 -102 -60 -108" fill="none" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>`;
  } else {
    o += s`<path d="M-134 -108C-110 -150 -50 -176 0 -178C50 -176 110 -150 134 -108Q0 -86 -134 -108Z" fill="${c.lin([[0, L(clay, 0.3)], [0.5, clay], [1, D(clay, 0.25)]], 0, 0, 1, 1)}"/>`;
    seed('clay' + clay);
    let dots = '';
    for (let i = 0; i < 40; i++) dots += s`<circle cx="${rr(-110, 110)}" cy="${rr(-165, -105)}" r="${rr(0.8, 2)}"/>`;
    o += s`<g fill="${D(clay, 0.3)}" opacity=".4" clip-path="${c.clip(`<path d="M-134 -108C-110 -150 -50 -176 0 -178C50 -176 110 -150 134 -108Z"/>`)}">${dots}</g>`;
  }
  return o;
}
function spoon(c, col = '#9A6A44', clay = null) {
  return contact(c, 0, 0, 90, 0.2) + place(0, -8, 1,
    s`<rect x="-120" y="-6" width="150" height="12" rx="6" fill="${vol(c, col)}"/><ellipse cx="62" cy="0" rx="42" ry="22" fill="${vol(c, col)}"/>` +
    (clay ? s`<ellipse cx="62" cy="-2" rx="34" ry="15" fill="${c.lin([[0, L(clay, 0.25)], [1, D(clay, 0.2)]], 0, 0, 1, 1)}"/>` : '') +
    s`<path d="M-112 -2H20" stroke="#fff" stroke-width="2" opacity=".3"/>`, -10);
}
function clayStones(c, col, arr) {
  let o = '';
  for (const [x, y, sc] of arr) {
    o += contact(c, x, y, 26 * sc, 0.3);
    o += place(x, y, sc, s`<path d="M-26 -4C-28 -18 -10 -26 8 -24C26 -22 30 -10 26 -2C20 6 -20 6 -26 -4Z" fill="${vol(c, col)}"/><path d="M-18 -16C-6 -22 8 -22 16 -18" fill="none" stroke="#fff" stroke-width="2" opacity=".3"/>`);
  }
  return o;
}

/** Théière marocaine argentée. */
function teapot(c) {
  const gid = c.id();
  const ch = chrome(c);
  let g = `<g id="${gid}">`;
  g += s`<path d="M68 -170C150 -196 170 -90 92 -58" fill="none" stroke="${ch}" stroke-width="13" stroke-linecap="round"/>`;
  g += s`<path d="M68 -170C150 -196 170 -90 92 -58" fill="none" stroke="${PLUM}" stroke-opacity=".2" stroke-width="2"/>`;
  g += s`<path d="M-96 -96C-150 -112 -158 -196 -212 -236L-200 -246C-150 -214 -126 -134 -88 -62Z" fill="${c.lin([[0, '#8E889E'], [0.4, '#F4F2F8'], [1, '#8A849A']], 0, 0, 1, 1)}"/>`;
  g += s`<path d="M-62 0L-50 -18H50L62 0Z" fill="${ch}"/>`;
  const body = 'M-48 -18C-122 -26 -132 -122 -66 -172C-52 -184 -42 -194 -40 -208L40 -208C42 -194 52 -184 66 -172C132 -122 122 -26 48 -18Z';
  g += s`<path d="${body}" fill="${ch}"/>`;
  // gravures
  const eng = D('#9C97AB', 0.35);
  let sc = '';
  for (let x = -96; x <= 80; x += 22) sc += s`M${x} -94q11 -18 22 0q-11 16 -22 0`;
  g += s`<g fill="none" stroke="${eng}" stroke-width="1.1" opacity=".55"><path d="M-112 -70Q0 -52 112 -70M-112 -116Q0 -100 112 -116M-70 -168Q0 -158 70 -168"/><path d="${sc}"/></g>`;
  g += s`<path d="M-80 -150C-110 -120 -112 -70 -90 -40" fill="none" stroke="#fff" stroke-width="8" opacity=".5" stroke-linecap="round" filter="${c.blur(2)}"/>`;
  g += s`<rect x="-46" y="-222" width="92" height="16" rx="5" fill="${ch}"/>`;
  g += s`<path d="M-42 -222C-42 -270 -12 -284 0 -306C12 -284 42 -270 42 -222Z" fill="${ch}"/>`;
  g += s`<path d="M-30 -232Q0 -244 30 -232M-22 -256Q0 -264 22 -256" fill="none" stroke="${eng}" stroke-width="1" opacity=".55"/>`;
  g += s`<circle cx="0" cy="-314" r="9" fill="${c.rad([[0, '#fff'], [0.6, '#C9C5D4'], [1, '#77718A']], 0.35, 0.3, 0.7)}"/><path d="M0 -322V-338" stroke="#B2ADC2" stroke-width="3" stroke-linecap="round"/>`;
  return floorCast(c, gid, 0.14) + contact(c, 0, 0, 80, 0.38) + g + '</g>';
}
/** Verre à thé décoré. */
function teaGlass(c, { band = '#7C3AED', band2 = GOLD } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<path d="M-27 0L-33 -100H33L27 0Z" fill="${c.lin([[0, '#fff', 0.55], [0.3, '#fff', 0.15], [0.8, '#fff', 0.2], [1, '#fff', 0.5]])}"/>`;
  g += s`<path d="M-28.5 -6L-32 -72H32L28.5 -6Q0 2 -28.5 -6Z" fill="${c.lin([[0, '#D9893A'], [0.5, '#B4651F'], [1, '#7A3A12']])}" opacity=".9"/>`;
  g += s`<ellipse cx="0" cy="-72" rx="32" ry="5" fill="#E2A25A"/>`;
  g += s`<path d="M-33 -100H33L31.6 -78H-31.6Z" fill="${band}" opacity=".88"/>`;
  let dec = '';
  for (let x = -26; x <= 26; x += 10.4) dec += s`<path d="M${x} -96L${x + 4} -89L${x} -82L${x - 4} -89Z"/>`;
  g += s`<g fill="${band2}">${dec}</g><path d="M-33 -100H33M-31.6 -78H31.6" stroke="${band2}" stroke-width="1.6"/>`;
  g += s`<rect x="-28" y="-96" width="4" height="90" rx="2" fill="#fff" opacity=".55"/>`;
  g += s`<path d="M-27 0L-33 -100H33L27 0Z" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.2"/>`;
  g += s`<g fill="#5E8C55"><ellipse cx="6" cy="-106" rx="10" ry="5" transform="rotate(-30 6 -106)"/><ellipse cx="16" cy="-112" rx="9" ry="4.5" transform="rotate(20 16 -112)"/><ellipse cx="-2" cy="-112" rx="8" ry="4" transform="rotate(-70 -2 -112)"/></g>`;
  return floorCast(c, gid, 0.1) + contact(c, 0, 0, 32, 0.34) + g + '</g>';
}
function tray(c, rx = 270) {
  return contact(c, 0, 0, rx * 0.95, 0.3) +
    s`<ellipse cx="0" cy="-6" rx="${rx}" ry="${rx * 0.2}" fill="${chrome(c)}"/><ellipse cx="0" cy="-10" rx="${rx - 14}" ry="${rx * 0.2 - 8}" fill="${c.lin([[0, '#ECE9F3'], [1, '#B6B1C4']], 0, 0, 0.6, 1)}"/>` +
    s`<ellipse cx="0" cy="-10" rx="${rx - 40}" ry="${rx * 0.2 - 18}" fill="none" stroke="#9C97AB" stroke-width="1" stroke-dasharray="3 5" opacity=".6"/>`;
}

/** Mini ventilateur rechargeable. */
function miniFan(c, { col = '#F7F3FC', acc = '#C4B5FD' } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<ellipse cx="0" cy="-12" rx="78" ry="20" fill="${vol(c, col, 0.3)}"/><ellipse cx="0" cy="-18" rx="70" ry="15" fill="${L(col, 0.5)}"/>`;
  g += s`<rect x="-28" y="-250" width="56" height="236" rx="28" fill="${vol(c, col, 0.32)}"/>`;
  g += s`<rect x="-20" y="-236" width="8" height="200" rx="4" fill="#fff" opacity=".6"/>`;
  g += s`<circle cx="0" cy="-196" r="7" fill="${acc}"/><g fill="${D(acc, 0.2)}"><circle cx="-8" cy="-164" r="2.2"/><circle cx="0" cy="-164" r="2.2"/><circle cx="8" cy="-164" r="2.2"/></g>`;
  g += s`<rect x="-18" y="-280" width="36" height="40" rx="10" fill="${vol(c, D(col, 0.06))}"/>`;
  const cy = -390, R = 118;
  g += s`<circle cx="0" cy="${cy}" r="${R}" fill="${vol(c, col, 0.3)}"/>`;
  g += s`<circle cx="0" cy="${cy}" r="${R - 14}" fill="${c.rad([[0, L(acc, 0.5)], [1, D(acc, 0.25)]], 0.4, 0.4, 0.7)}"/>`;
  let bl = '';
  for (let i = 0; i < 5; i++) bl += s`<path d="M0 ${cy}C20 ${cy - 30} 40 ${cy - 90} 10 ${cy - 98}C-20 ${cy - 100} -18 ${cy - 40} 0 ${cy}Z" transform="rotate(${i * 72 + 12} 0 ${cy})"/>`;
  g += s`<g fill="${L(acc, 0.35)}" opacity=".9">${bl}</g>`;
  let gr = '';
  for (const r of [92, 72, 52, 32]) gr += s`<circle cx="0" cy="${cy}" r="${r}"/>`;
  let sp = '';
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    sp += s`M${Math.cos(a) * 26} ${cy + Math.sin(a) * 26}L${Math.cos(a) * (R - 14)} ${cy + Math.sin(a) * (R - 14)}`;
  }
  g += s`<g fill="none" stroke="#fff" stroke-width="2.2" opacity=".9">${gr}<path d="${sp}"/></g>`;
  g += s`<circle cx="0" cy="${cy}" r="${R - 7}" fill="none" stroke="${L(col, 0.6)}" stroke-width="5"/>`;
  g += s`<circle cx="0" cy="${cy}" r="24" fill="${vol(c, col, 0.3)}"/><circle cx="0" cy="${cy}" r="10" fill="${acc}"/>`;
  g += s`<path d="M${-R * 0.8} ${cy - R * 0.4}A${R} ${R} 0 0 1 ${-R * 0.2} ${cy - R * 0.95}" fill="none" stroke="#fff" stroke-width="6" opacity=".6" stroke-linecap="round"/>`;
  return floorCast(c, gid, 0.13) + contact(c, 0, 0, 84, 0.36) + g + '</g>';
}

/** Organisateur cosmétique rotatif en acrylique. */
function organizer(c, { tint = '#E9E2F6' } = {}) {
  const gid = c.id();
  const clear = c.lin([[0, '#fff', 0.6], [0.15, tint, 0.25], [0.6, tint, 0.15], [0.9, tint, 0.3], [1, '#fff', 0.55]]);
  const tier = (y, rx, h, inside) => {
    const ry = rx * 0.2;
    return s`<ellipse cx="0" cy="${y - h}" rx="${rx}" ry="${ry}" fill="${tint}" fill-opacity=".25" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>` + inside +
      s`<path d="M${-rx} ${y - h}V${y}A${rx} ${ry} 0 0 0 ${rx} ${y}V${y - h}A${rx} ${ry} 0 0 1 ${-rx} ${y - h}Z" fill="${clear}"/>` +
      s`<path d="M${-rx} ${y}A${rx} ${ry} 0 0 0 ${rx} ${y}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="2.5"/>` +
      s`<path d="M${-rx + 10} ${y - h + 8}V${y - 4}" stroke="#fff" stroke-width="5" opacity=".7" stroke-linecap="round"/>`;
  };
  const lip = (x, y, col, h = 70) => s`<rect x="${x - 9}" y="${y - h}" width="18" height="${h * 0.55}" rx="2" fill="${col}"/><path d="M${x - 9} ${y - h}V${y - h - 14}L${x + 9} ${y - h - 22}V${y - h}Z" fill="${col}"/><rect x="${x - 10}" y="${y - h * 0.47}" width="20" height="${h * 0.47}" rx="2" fill="${metal(c)}"/>`;
  const brush = (x, y, rot, col) => s`<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 4}" y="${y - 150}" width="8" height="150" rx="4" fill="${col}"/><rect x="${x - 5}" y="${y - 170}" width="10" height="24" fill="${metal(c, '#D8D3E2')}"/><path d="M${x - 6} ${y - 170}C${x - 10} ${y - 200} ${x + 10} ${y - 200} ${x + 6} ${y - 170}Z" fill="#E8D2C4"/></g>`;
  let g = `<g id="${gid}">`;
  g += s`<ellipse cx="0" cy="-8" rx="160" ry="32" fill="${c.lin([[0, '#fff'], [1, L(tint, 0.2)]], 0, 0, 0, 1)}" stroke="#fff" stroke-width="2"/>`;
  g += tier(-14, 150, 110,
    s`<rect x="-120" y="-130" width="40" height="70" rx="8" fill="#F2B8D0"/><rect x="-116" y="-150" width="32" height="22" rx="4" fill="${metal(c)}"/>` +
    s`<rect x="-60" y="-120" width="50" height="58" rx="12" fill="#EADCF7"/><rect x="-56" y="-132" width="42" height="14" rx="4" fill="#B49AE0"/>` +
    s`<rect x="10" y="-140" width="34" height="78" rx="6" fill="#C9A6F0"/><rect x="18" y="-170" width="18" height="32" rx="4" fill="${metal(c)}"/>` +
    s`<rect x="66" y="-118" width="52" height="56" rx="26" fill="#F9D7E5"/>`);
  g += tier(-124, 112, 100, lip(-70, -132, '#C0264F') + lip(-36, -136, '#E2557B', 80) + lip(0, -134, '#9D2A62') + lip(34, -136, '#E88FA6', 76) + lip(68, -132, '#7C3AED'));
  g += tier(-224, 66, 120, brush(-30, -236, -14, '#2E1430') + brush(-8, -240, -4, '#E6C9DA') + brush(14, -240, 6, '#7C3AED') + brush(34, -236, 16, '#2E1430'));
  return floorCast(c, gid, 0.1) + contact(c, 0, 0, 162, 0.3) + g + '</g>';
}

/** Sac à main structuré. */
function handbag(c, { col = '#5A1D5E' } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  g += s`<path d="M-80 -244C-82 -340 82 -340 80 -244" fill="none" stroke="${D(col, 0.15)}" stroke-width="18" stroke-linecap="round"/>`;
  g += s`<path d="M-80 -244C-82 -340 82 -340 80 -244" fill="none" stroke="${L(col, 0.25)}" stroke-width="5" opacity=".6" transform="translate(-2 -4)"/>`;
  g += s`<path d="M-80 -244C-82 -340 82 -340 80 -244" fill="none" stroke="${L(col, 0.5)}" stroke-width="1.2" stroke-dasharray="3 3" opacity=".7"/>`;
  for (const x of [-80, 80]) g += s`<rect x="${x - 9}" y="-252" width="18" height="16" rx="3" fill="${metal(c)}"/>`;
  g += s`<path d="M150 -12L130 -230L118 -236L134 -6Z" fill="${D(col, 0.35)}"/>`;
  const body = 'M-150 -12C-150 -4 -144 0 -134 0H134C144 0 150 -4 150 -12L130 -224C129 -232 124 -236 116 -236H-116C-124 -236 -129 -232 -130 -224Z';
  g += s`<path d="${body}" fill="${vol(c, col, 0.3)}"/>`;
  g += s`<path d="${body}" fill="${c.pat('lea' + col, 7, 7, s`<circle cx="2" cy="2" r=".9" fill="${D(col, 0.4)}" opacity=".35"/><circle cx="5.5" cy="5" r=".7" fill="${L(col, 0.4)}" opacity=".3"/>`)}"/>`;
  g += s`<path d="M-144 -14L-125 -226H125L144 -14Z" fill="none" stroke="${L(col, 0.35)}" stroke-width="1.2" stroke-dasharray="4 3" opacity=".7"/>`;
  const flap = 'M-126 -236H126L128 -214C120 -150 60 -126 0 -124C-60 -126 -120 -150 -128 -214Z';
  g += s`<path d="M-126 -126Q0 -116 126 -126L128 -110Q0 -100 -128 -110Z" fill="${PLUM}" opacity=".18" filter="${c.blur(4)}"/>`;
  g += s`<path d="${flap}" fill="${vol(c, L(col, 0.04), 0.3)}"/>`;
  g += s`<path d="M-118 -228H118L120 -212C112 -156 56 -134 0 -132C-56 -134 -112 -156 -120 -212Z" fill="none" stroke="${L(col, 0.4)}" stroke-width="1.2" stroke-dasharray="4 3" opacity=".75"/>`;
  g += s`<rect x="-26" y="-148" width="52" height="34" rx="8" fill="${metal(c)}"/><rect x="-16" y="-140" width="32" height="18" rx="5" fill="${c.lin([[0, '#FCF2D6'], [1, GOLD_D]], 0, 0, 1, 1)}"/>`;
  g += s`<path d="M-140 -40C-120 -120 -116 -180 -112 -220" fill="none" stroke="#fff" stroke-width="6" opacity=".18" stroke-linecap="round" filter="${c.blur(3)}"/>`;
  return floorCast(c, gid, 0.14) + contact(c, 0, 0, 158, 0.36) + g + '</g>';
}

/** Gourde isotherme. */
function bottleFlask(c, { col = '#7C5CC4' } = {}) {
  const gid = c.id();
  let g = `<g id="${gid}">`;
  const d = 'M-58 -20V-312C-58 -336 -42 -350 -38 -362H38C42 -350 58 -336 58 -312V-20Q58 0 38 0H-38Q-58 0 -58 -20Z';
  g += s`<path d="${d}" fill="${c.lin([[0, L(col, 0.18)], [0.3, L(col, 0.1)], [0.7, col], [1, D(col, 0.22)]])}"/>`;
  g += s`<path d="${d}" fill="${c.pat('mat' + col, 4, 4, s`<circle cx="1" cy="1" r=".6" fill="#fff" opacity=".15"/>`)}"/>`;
  g += s`<rect x="-44" y="-320" width="10" height="290" rx="5" fill="#fff" opacity=".28" filter="${c.blur(3)}"/>`;
  g += s`<path d="M-58 -24V-20Q-58 0 -38 0H38Q58 0 58 -20V-24Z" fill="${chrome(c)}"/>`;
  g += s`<rect x="-40" y="-378" width="80" height="18" rx="3" fill="${chrome(c)}"/>`;
  g += s`<rect x="-44" y="-436" width="88" height="60" rx="12" fill="${vol(c, D(col, 0.1))}"/>`;
  g += s`<path d="M-20 -436C-20 -470 20 -470 20 -436" fill="none" stroke="${D(col, 0.15)}" stroke-width="10" stroke-linecap="round"/>`;
  g += s`<path d="M-44 -400H44" stroke="${D(col, 0.3)}" stroke-width="1.5" opacity=".6"/>`;
  return floorCast(c, gid, 0.13) + contact(c, 0, 0, 66, 0.38) + g + '</g>';
}

/** Petit pot rond à couvercle. */
function roundJar(c, { col = '#FFFFFF', lid = GOLD, w = 70, h = 52 } = {}) {
  return contact(c, 0, 0, w * 0.6, 0.3) +
    s`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="8" fill="${vol(c, col, 0.25)}"/>` +
    s`<rect x="${-w / 2 - 2}" y="${-h - 22}" width="${w + 4}" height="24" rx="6" fill="${metal(c, lid)}"/><ellipse cx="0" cy="${-h - 22}" rx="${w / 2 + 2}" ry="7" fill="${L(lid, 0.4)}"/>`;
}

/* Accessoires de nature morte */
function stemVase(c, { col = '#F6F0E8', stems = '#D9C7A8' } = {}) {
  let o = contact(c, 0, 0, 46, 0.32);
  o += s`<g fill="none" stroke="#9C8467" stroke-width="2.2"><path d="M-4 -120C-10 -220 -40 -300 -70 -380"/><path d="M2 -120C10 -230 30 -320 64 -400"/><path d="M0 -120C2 -200 -4 -280 6 -350"/></g>`;
  for (const [x, y, rot, sc] of [[-70, -380, -30, 1], [64, -400, 28, 1.1], [6, -350, 4, 0.85]]) {
    o += place(x, y, sc,
      s`<ellipse rx="16" ry="54" fill="${stems}" opacity=".9" filter="${c.blur(2.5)}"/><ellipse cx="-3" cy="-6" rx="8" ry="40" fill="${L(stems, 0.5)}" opacity=".7" filter="${c.blur(2)}"/>`, rot);
  }
  o += s`<path d="M-14 -150H14V-128C40 -116 52 -86 50 -56C48 -16 28 0 0 0C-28 0 -48 -16 -50 -56C-52 -86 -40 -116 -14 -128Z" fill="${vol(c, col, 0.3)}"/>`;
  o += s`<ellipse cx="0" cy="-150" rx="14" ry="4" fill="${D(col, 0.3)}"/><path d="M-34 -96C-42 -70 -40 -40 -28 -20" fill="none" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>`;
  return o;
}
function pebbles(c, col = '#CFC3D9') {
  return contact(c, 0, 0, 60, 0.3) + contact(c, 70, 4, 34, 0.28) +
    s`<ellipse cx="0" cy="-16" rx="58" ry="20" fill="${c.rad([[0, L(col, 0.5)], [0.6, col], [1, D(col, 0.3)]], 0.35, 0.3, 0.8)}"/>` +
    s`<ellipse cx="72" cy="-8" rx="32" ry="13" fill="${c.rad([[0, L(col, 0.4)], [0.6, D(col, 0.08)], [1, D(col, 0.35)]], 0.35, 0.3, 0.8)}"/>`;
}
function dish(c, col = '#F7F2EC') {
  return contact(c, 0, 0, 80, 0.3) + s`<path d="M-90 -18C-80 -2 -40 4 0 4C40 4 80 -2 90 -18Z" fill="${vol(c, col, 0.3)}"/><ellipse cx="0" cy="-18" rx="90" ry="18" fill="${L(col, 0.4)}"/><ellipse cx="0" cy="-17" rx="74" ry="12" fill="${c.rad([[0, '#fff'], [1, D(col, 0.12)]], 0.45, 0.4, 0.7)}"/>`;
}
function foldedCloth(c, col = '#E9DCCB') {
  return contact(c, 0, 0, 120, 0.3) + foldStack(c, { w: 220, h: 34, d: 150, k: 0.5, col, layers: 2, r: 10, top: s`<rect width="220" height="160" fill="${weave(c, D(col, 0.3), 0.2)}"/>` });
}
function compass(c) {
  return contact(c, 0, 0, 40, 0.3) + s`<ellipse cx="0" cy="-10" rx="40" ry="16" fill="${D(GOLD, 0.2)}"/><ellipse cx="0" cy="-16" rx="40" ry="16" fill="${metal(c)}"/><ellipse cx="0" cy="-17" rx="32" ry="12" fill="#FBF8F2"/>` +
    s`<path d="M-22 -14L0 -19L22 -20L0 -15Z" fill="#C0264F"/><path d="M-22 -14L0 -15L22 -20L0 -19Z" fill="#2E1430" opacity=".7"/><circle cx="0" cy="-17" r="2.5" fill="${GOLD}"/>`;
}
function zipPouch(c, col) {
  let o = contact(c, 0, 0, 90, 0.32);
  const d = 'M-90 -10C-92 -60 -88 -100 -80 -112H80C88 -100 92 -60 90 -10Q90 0 78 0H-78Q-90 0 -90 -10Z';
  o += s`<path d="${d}" fill="${vol(c, col)}"/><path d="${d}" fill="${weave(c, L(col, 0.3), 0.15)}"/>`;
  o += s`<path d="M-80 -104H80" stroke="${D(col, 0.4)}" stroke-width="7"/><path d="M-78 -104H78" stroke="${L(col, 0.5)}" stroke-width="2" stroke-dasharray="1.5 2"/>`;
  o += s`<rect x="40" y="-112" width="16" height="12" rx="2" fill="${metal(c)}"/><path d="M48 -100L46 -76L52 -76Z" fill="${GOLD}"/>`;
  o += s`<path d="M-84 -16H84" stroke="${L(col, 0.3)}" stroke-width="1.2" stroke-dasharray="4 3" opacity=".6"/>`;
  return o;
}

/* ------------------------------------------------------------------ */
/* Compositions produits                                               */
/* ------------------------------------------------------------------ */
const HANG = (fn) => (c, col, alt) =>
  alt ? place(370, 112, 0.95, fn(c, col)) + place(650, 880, 0.9, stemVase(c)) : place(400, 112, 0.95, fn(c, col));

const RUG_ACC = { '#7A1F3D': '#E7B8C4', '#1F5E4E': '#BFE0D2', '#24325E': '#B9C4EA', '#5E2A5A': '#E6BFDF', '#6B5B8C': '#D9D0EE', '#8C7A6B': '#EADFD3' };

const P = [];
const add = (cat, slug, label, A, B, nameA, nameB, draw, focus, opts = {}) => P.push({ cat, slug, label, A, B, nameA, nameB, draw, focus, ...opts });

// --- Robes de prière
add('robes-de-priere', 'robe-priere-deux-pieces-lilas', 'robe de prière deux pièces', '#C4B5FD', '#E8A5C0', 'lilas', 'vieux rose',
  HANG((c, col) => prayerDress(c, col)), [400, 280, 2.1]);
add('robes-de-priere', 'robe-priere-enfant-petite-perle', 'robe de prière enfant', '#F9C9DA', '#F4EEE4', 'rose poudré', 'ivoire',
  (c, col, alt) => place(alt ? 370 : 400, 190, 0.8, prayerDress(c, col, { lace: true, len: 0.93 })) + (alt ? place(640, 880, 0.85, pebbles(c)) : place(560, 880, 0.7, dish(c))),
  [400, 560, 2.4], { tintA: 'blush', tintB: 'lilac' });
add('robes-de-priere', 'abaya-priere-brodee-nour', 'abaya de prière brodée', '#4A1650', '#2E2A33', 'prune et or', 'anthracite',
  HANG((c, col) => abaya(c, col)), [520, 560, 2.4], { tintA: 'warm', tintB: 'lilac' });
add('robes-de-priere', 'jilbab-capuche-une-piece', 'jilbab à capuche une pièce', '#9D7BB0', '#C9C3CF', 'mauve', 'gris perle',
  HANG((c, col) => jilbab(c, col)), [400, 260, 2.2], { tintB: 'blush' });
add('robes-de-priere', 'robe-priere-zippee-serenite', 'robe de prière zippée pliée avec chapelet', '#A78BFA', '#A3AFA0', 'violet doux', 'vert de gris',
  (c, col, alt) => {
    const top = s`<path d="M96 6Q170 -14 244 6L222 112Q170 132 118 112Z" fill="${D(col, 0.1)}"/><path d="M96 6Q170 -14 244 6L222 112Q170 132 118 112Z" fill="none" stroke="${L(col, 0.45)}" stroke-width="2" stroke-dasharray="4 3"/><path d="M170 -4V118" stroke="${D(col, 0.3)}" stroke-width="1.5"/>` +
      s`<rect x="166" y="124" width="8" height="196" fill="${D(col, 0.3)}"/><path d="${Array.from({ length: 32 }, (_, i) => s`M${i % 2 ? 170 : 165} ${128 + i * 6}h5`).join('')}" stroke="#D8D3E2" stroke-width="2.4"/>` +
      s`<rect x="161" y="130" width="18" height="12" rx="2" fill="${metal(c, '#D8D3E2')}"/><path d="M170 142L166 172H174Z" fill="#C9C3D4"/>` +
      s`<rect width="340" height="330" fill="${weave(c, D(col, 0.4), 0.14)}"/><path d="M20 24H320" stroke="${L(col, 0.4)}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    return onPlinth(c, 400, place(alt ? 40 : -40, 0, 1.32, stackShadow(c, 340) + foldStack(c, { w: 340, h: 92, d: 330, k: 0.44, col, layers: 4, top })) +
      place(alt ? -225 : 225, 6, 0.85, tasbih(c, { col: alt ? '#F4EEE4' : '#EADBC4', tassel: alt ? '#9D7BB0' : GOLD })), { col: alt ? '#FBF2F6' : '#F6F0FA' });
  }, [380, 640, 2.1], {});

// --- Tapis de prière
add('tapis-de-priere', 'tapis-priere-velours-medine', 'tapis de prière en velours', '#7A1F3D', '#1F5E4E', 'bordeaux', 'émeraude',
  (c, col, alt) => alt
    ? place(400, 900, 1.15, rugFloor(c, { w: 320, h: 560, col, acc: RUG_ACC[col] })) + place(650, 860, 0.8, stemVase(c))
    : place(400, 150, 1, rugHanging(c, { w: 320, h: 560, col, acc: RUG_ACC[col] })),
  [400, 330, 2.1], { bd3: { floorY: 600, atop: 60, arch: 'pointed', aw: 420 } });
add('tapis-de-priere', 'tapis-priere-voyage-pliable', 'tapis de prière de voyage pliable', '#24325E', '#5E2A5A', 'bleu nuit', 'prune',
  (c, col, alt) => {
    const art = s`<g transform="translate(0 -120)">` + rugArt(c, { w: 320, h: 520, col, acc: RUG_ACC[col] }) + '</g>';
    const st = place(alt ? 50 : -50, 0, 1.3, stackShadow(c, 330) + foldStack(c, { w: 320, h: 56, d: 300, k: 0.44, col, layers: 6, r: 8, top: s`<g clip-path="${c.clip('<rect width="320" height="300"/>')}">${art}</g>`, sideCol: D(col, 0.1) }));
    return onPlinth(c, 400, st + place(alt ? -235 : 235, 8, 0.62, zipPouch(c, alt ? '#CDBFE4' : D(col, 0.05)))) + place(alt ? 680 : 120, 985, 0.9, compass(c));
  }, [360, 660, 2.1], {});
add('tapis-de-priere', 'tapis-priere-mousse-confort', 'tapis de prière en mousse confort', '#6B5B8C', '#8C7A6B', 'gris violet', 'taupe',
  (c, col, alt) => {
    const top = s`<g transform="translate(0 -100)">` + rugArt(c, { w: 330, h: 520, col, acc: RUG_ACC[col], quilt: true }) + '</g>';
    const edge = s`<path d="M-165 -116H165M-165 -58H165" stroke="${L(col, 0.35)}" stroke-width="3" opacity=".7"/>`;
    const st = foldStack(c, { w: 330, h: 120, d: 300, k: 0.44, col, layers: 2, r: 22, top: s`<g clip-path="${c.clip('<rect width="330" height="300"/>')}">${top}</g>`, edge, soft: false });
    return onPlinth(c, 400, place(0, 0, 1.3, stackShadow(c, 330) + st)) + (alt ? place(120, 980, 0.7, dish(c)) : place(680, 985, 0.7, pebbles(c)));
  }, [400, 660, 2.1], {});
add('tapis-de-priere', 'tapis-priere-enfant', 'tapis de prière enfant étoiles et croissant', '#F9A8D4', '#93C5FD', 'rose', 'bleu ciel',
  (c, col, alt) => alt
    ? place(400, 190, 1, rugHanging(c, { w: 280, h: 440, col, acc: '#FFFFFF', gold: '#FFF4C2', motif: 'stars' })) + place(620, 890, 0.8, pebbles(c))
    : place(390, 900, 1.25, rugFloor(c, { w: 280, h: 440, col, acc: '#FFFFFF', gold: '#FFF4C2', motif: 'stars', roll: 0.24 })),
  [420, 760, 2.2], { tintA: 'blush', tintB: 'lilac', bd: { floorY: 600, atop: 60 }, bd3: { floorY: 790 } });
add('tapis-de-priere', 'coffret-tapis-chapelet', 'coffret cadeau tapis et chapelet', '#6D28D9', '#C026D3', 'violet', 'magenta',
  (c, col, alt) => {
    const inside = place(0, -232, 1, foldStack(c, { w: 250, h: 40, d: 150, k: 0.42, col: alt ? '#7A1F3D' : GOLD, layers: 3, r: 6, top: s`<g transform="translate(-30 -40)">${rugArt(c, { w: 310, h: 420, col: alt ? '#7A1F3D' : '#C99A4A', acc: alt ? '#E7B8C4' : '#FFF1D0' })}</g>` })) + place(30, -246, 0.75, tasbih(c, { col: '#F4EEE4', tassel: alt ? '#F9A8D4' : '#C4B5FD' }));
    return place(400, 880, 1, giftBox(c, { w: 330, h: 170, d: 200, col, rib: alt ? '#FBCFE8' : '#E9D5FF', open: true, inside, lidLean: true, tissue: '#F3E8FF' }));
  }, [420, 610, 2.2], { tintB: 'blush' });

// --- Parfums
add('parfums', 'eau-de-parfum-oud-royal', 'eau de parfum flacon oud', '#C47A1E', '#B7798A', 'ambré', 'rose fumé',
  (c, col, alt) => alt
    ? place(330, 900, 1, podium(c, { rx: 190, h: 70, col: '#F3E6EE' }) + place(0, -70, 0.95, oudBottle(c, { liq: col, cap: '#4A1E3A' }))) + place(620, 900, 0.8, pebbles(c, '#E2CBD6'))
    : place(400, 900, 1, podium(c, { rx: 200, h: 90 }) + place(0, -90, 1.05, oudBottle(c, { liq: col }))),
  [400, 470, 2.1], { tintB: 'rose' });
add('parfums', 'huile-parfumee-musc-blanc', 'huile parfumée roll-on', '#F6EEDC', '#F7C6D9', 'musc blanc', 'rose',
  (c, col, alt) => alt
    ? place(320, 880, 1, podium(c, { rx: 150, h: 60, col: '#FBEFF4' }) + place(0, -60, 1.5, rollOn(c, { liq: col, capOn: false }))) + place(590, 905, 1, capLying(c))
    : place(400, 900, 1, podium(c, { rx: 160, h: 100 }) + place(0, -100, 1.7, rollOn(c, { liq: col }))) + place(620, 920, 0.7, dish(c)),
  [400, 520, 2.2], { tintB: 'blush' });
add('parfums', 'coffret-trio-parfums-femme', 'coffret trio de parfums', '#F472B6', '#C4B5FD', 'rose et violet', 'lilas',
  (c, col, alt) => {
    const liqs = alt ? ['#C4B5FD', '#DDD6FE', '#E9D5FF'] : ['#F472B6', '#A855F7', '#FBCFE8'];
    const inside = place(-84, -60, 1, slimBottle(c, { liq: liqs[0], h: 210 })) + place(0, -66, 1, slimBottle(c, { liq: liqs[1], h: 240 })) + place(84, -60, 1, slimBottle(c, { liq: liqs[2], h: 200 }));
    return place(400, 890, 1.05, giftBox(c, { w: 320, h: 120, d: 180, col: alt ? '#DDD6FE' : '#F9D2E4', rib: null, open: true, inside, lidLean: true, tissue: alt ? '#EDE4FF' : '#FCE7F3' }));
  }, [400, 520, 2], { tintB: 'lilac' });
add('parfums', 'brume-corporelle-fleur-oranger', 'brume corporelle à la fleur d\'oranger', '#FBE3D2', '#F9D2DF', 'pêche', 'rose pâle',
  (c, col, alt) => place(alt ? 330 : 380, 900, 1, podium(c, { rx: 170, h: 70, col: alt ? '#F8E4EC' : '#F3EAF8' }) + place(0, -70, 1.15, mistBottle(c, { col }))) + place(alt ? 450 : 470, 890, 0.95, blossom(c)),
  [380, 420, 2.1], { tintA: 'warm', tintB: 'blush' });
add('parfums', 'thiouraye-nuit-de-dakar', 'thiouraye encens et brûleur en terre cuite', '#B8643F', '#5E2A5A', 'terre cuite', 'céramique prune',
  (c, col, alt) => place(alt ? 450 : 360, 880, 1.25, incenseBurner(c, { col })) + place(alt ? 190 : 600, 900, 1, incensePouch(c, alt ? '#C4B5FD' : '#6D2E5C')),
  [370, 520, 2.1], { tintA: 'warm', tintB: 'lilac' });

// --- Friperie
const jeansTop = (c, col, w, d) => {
  const st = (dd) => s`<path d="${dd}" fill="none" stroke="#E3A75C" stroke-width="1.4" stroke-dasharray="3 2.4"/>`;
  const twill = c.pat('tw' + col, 5, 5, s`<path d="M0 5L5 0M-1 1L1 -1M4 6L6 4" stroke="${L(col, 0.35)}" stroke-width=".8" opacity=".35"/>`);
  return s`<rect width="${w}" height="${d}" fill="${twill}"/><rect y="0" width="${w}" height="40" fill="${D(col, 0.1)}"/>` + st(s`M0 6H${w}M0 34H${w}`) +
    s`<g fill="${D(col, 0.15)}"><rect x="50" y="-2" width="12" height="46" rx="2"/><rect x="${w - 70}" y="-2" width="12" height="46" rx="2"/><rect x="${w / 2 - 6}" y="-2" width="12" height="46" rx="2"/></g>` +
    s`<circle cx="${w - 34}" cy="20" r="9" fill="${metal(c, '#C9894A')}"/><circle cx="${w - 34}" cy="20" r="3.5" fill="#8A5A2A"/>` +
    st(s`M${w * 0.62} 40C${w * 0.6} 140 ${w * 0.66} 200 ${w * 0.74} ${d}`) + st(s`M${w * 0.6} 40C${w * 0.58} 140 ${w * 0.64} 200 ${w * 0.72} ${d}`) +
    s`<path d="M14 40C40 90 80 104 112 104" fill="none" stroke="${D(col, 0.35)}" stroke-width="2"/>` + st('M14 46C40 96 80 110 112 110') +
    s`<path d="M${w * 0.74} ${d}C${w * 0.66} 200 ${w * 0.6} 140 ${w * 0.62} 40" fill="none" stroke="${D(col, 0.3)}" stroke-width="1.5"/>`;
};
add('friperie', 'jean-droit-femme', 'jean droit femme plié', '#4A6FA5', '#9DB7D5', 'bleu moyen', 'délavé clair',
  (c, col, alt) => {
    const st = (x, y, sc, cl) => place(x, y, sc, stackShadow(c, 330) + foldStack(c, { w: 330, h: 74, d: 320, k: 0.44, col: cl, layers: 3, r: 18, top: jeansTop(c, cl, 330, 320), edge: s`<path d="M-165 -60H165M-165 -14H165" stroke="#E3A75C" stroke-width="1.3" stroke-dasharray="3 2.4" opacity=".8"/>` }));
    return onPlinth(c, 400, alt ? st(-30, 0, 1.3, col) + place(235, 4, 0.55, pebbles(c, '#C9D4E4')) : st(0, 0, 1.35, col));
  }, [460, 640, 2.2], { tintB: 'warm' });
const shirtTop = (c, col, stripe, w, d) => {
  const sp = stripe ? c.pat('str' + col + stripe, 14, 14, s`<rect width="14" height="14" fill="${col}"/><rect x="0" width="4" height="14" fill="${stripe}"/>`) : col;
  const m = w / 2;
  return s`<rect width="${w}" height="${d}" rx="10" fill="${sp}"/><rect width="${w}" height="${d}" rx="10" fill="${c.lin([[0, '#fff', 0.2], [1, PLUM, 0.08]], 0, 0, 0, 1)}"/>` +
    s`<path d="M${m - 70} 0Q${m} 40 ${m + 70} 0" fill="${D(col, 0.12)}"/>` +
    s`<rect x="${m - 12}" y="30" width="24" height="${d - 30}" fill="${sp}" stroke="${D(col, 0.2)}" stroke-width="1"/>` +
    [70, 140, 210, 280].filter((y) => y < d).map((y) => s`<circle cx="${m}" cy="${y}" r="5" fill="#FBF8F2" stroke="${D(col, 0.25)}"/>`).join('') +
    s`<path d="M${m - 74} -4L${m - 6} 30L${m - 54} 86L${m - 96} 10Z" fill="${sp}" stroke="${D(col, 0.25)}" stroke-width="1.2"/><path d="M${m + 74} -4L${m + 6} 30L${m + 54} 86L${m + 96} 10Z" fill="${sp}" stroke="${D(col, 0.25)}" stroke-width="1.2"/>` +
    s`<path d="M${m - 74} -4L${m - 6} 30L${m - 54} 86L${m - 96} 10Z" fill="${PLUM}" opacity=".06"/><circle cx="${m}" cy="38" r="4" fill="#FBF8F2" stroke="${D(col, 0.25)}"/>` +
    s`<path d="M${m - 50} 140h40v46h-40z" fill="none" stroke="${D(col, 0.22)}" stroke-width="1.2"/>`;
};
add('friperie', 'chemise-homme-coton', 'chemise homme en coton pliée', '#F8FAFD', '#F6C9D6', 'rayures blanc et bleu', 'rose doux',
  (c, col, alt) => {
    const stripe = alt ? null : '#B9CDEA';
    return onPlinth(c, 400, place(0, 0, 1.35, stackShadow(c, 300) + foldStack(c, { w: 300, h: 44, d: 380, k: 0.44, col, layers: 2, r: 12, top: shirtTop(c, col, stripe, 300, 380), sideCol: stripe ? mix(col, stripe, 0.4) : col }))) +
      place(alt ? 120 : 680, 985, 0.7, alt ? pebbles(c) : dish(c));
  }, [400, 640, 2.2], { tintA: 'lilac', tintB: 'warm' });
add('friperie', 'veste-jean-vintage', 'veste en jean vintage', '#4C6E9E', '#2B2930', 'bleu', 'noir',
  (c, col, alt) => alt ? place(370, 150, 1.05, denimJacket(c, col, '#9A96A0')) + place(650, 880, 0.9, stemVase(c)) : place(400, 150, 1.05, denimJacket(c, col)),
  [400, 360, 2.2], { tintA: 'warm', tintB: 'lilac' });
add('friperie', 'robe-ete-fleurie', 'robe d\'été fleurie', '#FBF5EC', '#D8C8F5', 'ivoire à fleurs roses', 'lilas à fleurs blanches',
  (c, col, alt) => place(alt ? 370 : 400, 112, 0.95, summerDress(c, col, alt ? ['#FFFFFF', '#F3E8FF', '#9DB59A'] : ['#EC4899', '#8B5CF6', '#8FB08A'])) + (alt ? place(650, 880, 0.9, stemVase(c)) : ''),
  [400, 300, 2.2], { tintA: 'blush', tintB: 'lilac' });

// --- Ensembles chez Cathy
const WAX_A = ['#C026D3', '#F08A24', '#5B21B6', '#FFE6C7'], WAX_B = ['#1E4FA3', '#F2C230', '#0E2A5C', '#FFF4D6'];
add('ensembles-chez-cathy', 'ensemble-wax-deux-pieces', 'ensemble wax deux pièces', WAX_A, WAX_B, 'magenta, orange et violet', 'bleu et jaune',
  (c, col, alt) => place(alt ? 370 : 400, 112, 0.95, waxSet(c, col)) + (alt ? place(650, 880, 0.9, stemVase(c)) : ''),
  [400, 300, 2.2], { tintA: 'warm', tintB: 'lilac' });
add('ensembles-chez-cathy', 'ensemble-lin-ete', 'ensemble en lin chemise et pantalon plié', '#D8C3A0', '#C9B6E4', 'sable', 'lilas',
  (c, col, alt) => {
    const lin = c.pat('lin' + col, 4, 4, s`<path d="M0 2H4M2 0V4" stroke="${D(col, 0.3)}" stroke-width=".6" opacity=".35"/>`);
    const trousersTop = s`<rect width="340" height="320" fill="${lin}"/><rect width="340" height="36" fill="${D(col, 0.08)}"/><path d="M170 36V320" stroke="${D(col, 0.25)}" stroke-width="1.5"/>`;
    const shirtT = shirtTop(c, col, null, 290, 300) + s`<rect width="290" height="300" fill="${lin}"/>`;
    return onPlinth(c, 400, place(0, 0, 1.3, stackShadow(c, 340) + foldStack(c, { w: 340, h: 60, d: 320, k: 0.44, col: D(col, 0.06), layers: 3, r: 14, top: trousersTop }) +
      place(6, -60 - 6, 1, foldStack(c, { w: 290, h: 40, d: 300, k: 0.44, col, layers: 2, r: 12, top: shirtT })))) +
      place(alt ? 120 : 680, 985, 0.7, alt ? dish(c) : pebbles(c, '#DCCFC0'));
  }, [400, 600, 2.1], { tintA: 'warm', tintB: 'lilac' });
add('ensembles-chez-cathy', 'ensemble-tunique-pantalon-brode', 'ensemble tunique brodée et pantalon', '#1F6B57', '#5E2357', 'émeraude', 'prune',
  HANG((c, col) => tunicSet(c, col)), [400, 260, 2.3], { tintA: 'warm', tintB: 'blush' });
add('ensembles-chez-cathy', 'ensemble-enfant-wax', 'ensemble enfant en wax haut et short', ['#F472B6', '#F7C948', '#7C3AED', '#FFF1DA'], ['#2E8B57', '#7C3AED', '#123F2C', '#F1E9FF'], 'rose et jaune', 'vert et violet',
  null, [400, 330, 1.9], { flat: true });

// --- Produits du Maroc
add('produits-du-maroc', 'savon-noir-beldi', 'savon noir beldi et gant kessa', '#3B3526', '#3B3526', 'pot en verre', 'coupelle en terre cuite',
  (c, col, alt) => alt
    ? place(360, 900, 1.2, clayDish(c, { fill: col })) + place(620, 930, 1, kessa(c, '#C9B9A6'))
    : place(360, 880, 1, podium(c, { rx: 170, h: 80, col: '#EFE3DA' }) + place(0, -80, 1.15, soapJar(c, { paste: col }))) + place(620, 920, 1, kessa(c)),
  [360, 640, 2.4], { tintA: 'warm', tintB: 'lilac' });
add('produits-du-maroc', 'huile-argan-cosmetique', 'huile d\'argan cosmétique flacon compte-gouttes', '#E0A93A', '#E0A93A', 'ambre', 'ambre, autre angle',
  (c, col, alt) => alt
    ? place(300, 900, 1.15, dropperBottle(c, { oil: col })) + place(560, 910, 1, dish(c) + s`<ellipse cx="0" cy="-18" rx="22" ry="6" fill="${col}" opacity=".85"/>`) + arganNuts(c, [[480, 960, 10, 0], [660, 950, -20, 1], [610, 975, 30, 0]])
    : place(400, 900, 1, podium(c, { rx: 170, h: 70, col: '#F3E9E2' }) + place(0, -70, 1.25, dropperBottle(c, { oil: col }))) + arganNuts(c, [[170, 930, 10, 0], [230, 955, -20, 1], [610, 950, 25, 0], [665, 930, -10, 1]]),
  [400, 520, 2.1], { tintA: 'warm', tintB: 'blush' });
add('produits-du-maroc', 'caftan-brode', 'caftan brodé avec sfifa', '#5B21B6', '#1F6B57', 'violet royal', 'émeraude',
  HANG((c, col) => caftan(c, col)), [400, 250, 2.3], { tintA: 'warm', tintB: 'warm' });
add('produits-du-maroc', 'ghassoul-argile', 'ghassoul argile dans un bol', '#C9A68C', '#C9A68C', 'bol en bois', 'bol en céramique',
  (c, col, alt) => alt
    ? place(380, 880, 1.25, clayBowl(c, { wood: false, col: '#E8DFF3', clay: '#A97F66', wet: true })) + place(560, 940, 0.9, spoon(c, '#B08A63', '#A97F66'))
    : place(380, 870, 1.3, clayBowl(c, { clay: col })) + place(600, 945, 0.9, spoon(c, '#B08A63', col)) + clayStones(c, D(col, 0.1), [[170, 940, 1], [230, 965, 0.7]]),
  [380, 660, 2.3], { tintA: 'warm', tintB: 'lilac' });
add('produits-du-maroc', 'theiere-marocaine', 'théière marocaine et verres à thé', '#C9C6D3', '#C9C6D3', 'argent, verres violets', 'argent, verres roses et verts',
  (c, col, alt) => place(400, 900, 1, tray(c, 300)) +
    (alt
      ? place(470, 880, 1.05, teapot(c)) + place(230, 900, 1, teaGlass(c, { band: '#EC4899', band2: '#7FB08A' })) + place(310, 920, 1, teaGlass(c, { band: '#2E8B57', band2: GOLD }))
      : place(360, 880, 1.05, teapot(c)) + place(580, 900, 1, teaGlass(c)) + place(650, 920, 1, teaGlass(c, { band: '#C026D3' }))),
  [380, 720, 2.1], { tintB: 'blush' });

// --- Produits importés
add('produits-importes', 'mini-ventilateur-rechargeable', 'mini ventilateur rechargeable', ['#F7F3FC', '#C4B5FD'], ['#FCE7F3', '#F9A8D4'], 'blanc et lilas', 'rose',
  (c, [col, acc], alt) => place(alt ? 360 : 400, 900, 1.1, miniFan(c, { col, acc })) + (alt ? place(630, 910, 0.8, pebbles(c)) : ''),
  [400, 470, 2.1], { tintB: 'blush' });
add('produits-importes', 'organisateur-cosmetiques-rotatif', 'organisateur cosmétiques rotatif', '#E9E2F6', '#FBD3E6', 'transparent', 'transparent rosé',
  (c, col, alt) => place(400, 900, 1.25, organizer(c, { tint: col })), [400, 650, 2], { tintB: 'blush' });
add('produits-importes', 'sac-main-structure', 'sac à main structuré', '#5A1D5E', '#E7B4C3', 'cuir prune', 'blush',
  (c, col, alt) => alt
    ? place(360, 890, 1.15, handbag(c, { col })) + place(640, 905, 0.8, stemVase(c))
    : place(400, 890, 1, podium(c, { rx: 210, h: 60, col: '#F1E7F8' }) + place(0, -60, 1.25, handbag(c, { col }))),
  [400, 640, 2.4], { tintB: 'lilac' });
add('produits-importes', 'gourde-isotherme', 'gourde isotherme en inox', '#7C5CC4', '#E79BBF', 'violet mat', 'rose mat',
  (c, col, alt) => alt
    ? place(340, 900, 1.25, bottleFlask(c, { col })) + place(600, 905, 0.8, pebbles(c))
    : place(400, 900, 1, podium(c, { rx: 150, h: 80 }) + place(0, -80, 1.3, bottleFlask(c, { col }))),
  [400, 300, 2.2], { tintB: 'blush' });

// --- Lasalmah
add('lasalmah', 'lasalmah-coffret-signature', 'coffret cadeau signature avec ruban satiné', ['#3B1C6E', '#F6C1D6'], ['#F2C9D6', '#6D28D9'], 'violet profond', 'blush',
  (c, [col, rib], alt) => place(alt ? 380 : 400, 880, 1.1, giftBox(c, { w: 320, h: 230, d: 260, col, rib })) + (alt ? place(640, 905, 0.8, stemVase(c)) : ''),
  [400, 520, 2.2], { tintB: 'lilac' });
add('lasalmah', 'lasalmah-coffret-decouverte', 'coffret découverte ouvert avec petits pots', '#C026D3', '#C4B5FD', 'magenta', 'lilas',
  (c, col, alt) => {
    const inside = place(-80, -50, 1, roundJar(c, { col: '#FFFFFF', lid: GOLD })) + place(0, -62, 1.1, roundJar(c, { col: '#F3E8FF', lid: '#E8E4F0', w: 80, h: 60 })) + place(80, -50, 1, roundJar(c, { col: '#FCE7F3', lid: GOLD }));
    return place(400, 880, 1.15, giftBox(c, { w: 280, h: 110, d: 170, col, rib: alt ? '#F3E8FF' : '#FBCFE8', open: true, inside, lidLean: true, tissue: alt ? '#F3E8FF' : '#FCE7F3' }));
  }, [400, 640, 2.1], { tintA: 'blush', tintB: 'lilac' });

/* Ensemble enfant wax : composition à plat (vue de dessus). */
function flatKidSet(c, cols, alt) {
  const base = alt ? 'lilac' : 'blush';
  const t = TINTS[base];
  let o = s`<rect x="-600" y="-600" width="2000" height="2200" fill="${c.lin([[0, t.w0], [1, t.f0]], 0, 0, 0.4, 1)}"/>`;
  o += s`<ellipse cx="200" cy="120" rx="700" ry="600" fill="${c.rad([[0, '#fff', 0.7], [1, '#fff', 0]])}"/>`;
  o += s`<path d="M-100 1100L900 -100" stroke="#fff" stroke-width="160" opacity=".18" filter="${c.blur(40)}"/>`;
  const pTop = waxPat(c, cols, 0.8, 15), pSh = waxPat(c, cols, 0.8, -20);
  const top = 'M-60 -150L-130 -130L-196 -60L-150 -10L-118 -44L-116 120Q0 132 116 120L118 -44L150 -10L196 -60L130 -130L60 -150Q0 -100 -60 -150Z';
  const shorts = 'M-120 -90H120L134 90L28 104L0 0L-28 104L-134 90Z';
  const gidT = c.id(), gidS = c.id();
  const shadow = (id) => s`<use href="#${id}" transform="translate(16 22)" filter="${c.sil(12, 0.24)}"/>`;
  o += shadow(gidT) + shadow(gidS);
  o += s`<g id="${gidT}" transform="translate(${alt ? 420 : 390} 320) rotate(-6) scale(1.38)">` + cloth(c, top, cols[0], { pat: pTop, folds: ['M-60 -40L-70 110', 'M50 -20L60 110'], fw: 14, k: 0.15 }) +
    s`<path d="M-60 -150Q0 -100 60 -150" fill="none" stroke="${cols[3]}" stroke-width="7"/><path d="M-116 110Q0 122 116 110" fill="none" stroke="${PLUM}" stroke-opacity=".15" stroke-width="4"/></g>`;
  o += s`<g id="${gidS}" transform="translate(${alt ? 380 : 410} 720) rotate(5) scale(1.38)">` + cloth(c, shorts, cols[0], { pat: pSh, folds: ['M-60 -60L-80 90', 'M60 -60L80 90'], fw: 12, k: 0.15 }) +
    s`<rect x="-120" y="-90" width="240" height="24" fill="${cols[3]}"/><path d="M-120 -78H120" stroke="${D(cols[3], 0.3)}" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M-10 -84q-10 26 -20 34M10 -84q10 26 20 34" fill="none" stroke="${D(cols[3], 0.4)}" stroke-width="2.5" stroke-linecap="round"/></g>`;
  // accessoires vus de dessus
  o += place(alt ? 130 : 690, alt ? 900 : 930, 1, s`<ellipse cx="6" cy="8" rx="36" ry="30" fill="${PLUM}" opacity=".2" filter="${c.blur(6)}"/><ellipse rx="36" ry="30" fill="${c.rad([[0, '#fff'], [0.7, '#E8DFF0'], [1, '#CBBFD8']], 0.35, 0.3, 0.8)}"/>` +
    s`<ellipse cx="62" cy="34" rx="22" ry="18" fill="${c.rad([[0, '#fff'], [0.7, '#EDE2E8'], [1, '#CDBCC8']], 0.35, 0.3, 0.8)}"/>`);
  return o;
}

/* ------------------------------------------------------------------ */
/* Rendu des fiches produits                                           */
/* ------------------------------------------------------------------ */
function prefixOf(slug) {
  return slug.split('-').map((w) => w[0]).join('') + (hash(slug) % 1296).toString(36);
}
function productSvg(p, num) {
  const c = new Ctx(prefixOf(p.slug) + num + '_');
  seed(p.slug + num);
  const alt = num === 3;
  const col = alt ? p.B : p.A;
  let scene;
  if (p.flat) scene = flatKidSet(c, col, alt);
  else {
    const bd = { ...(p.bd || {}), tint: alt ? p.tintB || 'blush' : p.tintA || 'lilac' };
    if (alt) Object.assign(bd, { arch: 'pointed', ax: 430, aw: 430, patchX: 0.04 }, p.bd3 || {});
    scene = backdrop(c, bd) + p.draw(c, col, alt);
  }
  if (num === 2) {
    const [fx, fy, z] = p.focus;
    const vx = Math.min(Math.max(fx, 400 / z), 800 - 400 / z), vy = Math.min(Math.max(fy, 500 / z), 1000 - 500 / z);
    scene = s`<g transform="translate(400 500) scale(${z}) translate(${-vx} ${-vy})">` + scene + '</g>';
  }
  const name = alt ? p.nameB : p.nameA;
  const label = `Illustration : ${p.label} ${name}` + (num === 2 ? ' — vue de détail' : num === 3 ? ' — variante' : '');
  return svgDoc(c, 800, 1000, label, scene + vignette(c));
}

/* ------------------------------------------------------------------ */
/* Couvertures de catégories                                           */
/* ------------------------------------------------------------------ */
const CATS = {
  'robes-de-priere': ['Robes de prière', 'lilac', (c) => place(400, 100, 0.9, prayerDress(c, '#C4B5FD')) + place(250, 920, 0.62, stackShadow(c, 340) + foldStack(c, { w: 340, h: 92, d: 330, k: 0.45, col: '#E8A5C0', layers: 4, top: s`<rect width="340" height="330" fill="${weave(c, '#B67C96', 0.14)}"/>` })) + place(600, 935, 0.75, tasbih(c))],
  'tapis-de-priere': ['Tapis de prière', 'blush', (c) => place(400, 130, 0.95, rugHanging(c, { w: 320, h: 560, col: '#7A1F3D', acc: '#E7B8C4' })) + place(250, 930, 0.6, stackShadow(c, 330) + foldStack(c, { w: 330, h: 70, d: 300, k: 0.45, col: '#1F5E4E', layers: 4, top: s`<g clip-path="${c.clip('<rect width="330" height="300"/>')}"><g transform="translate(0 -100)">${rugArt(c, { w: 330, h: 520, col: '#1F5E4E', acc: '#BFE0D2' })}</g></g>` })) + place(620, 945, 0.8, tasbih(c))],
  parfums: ['Parfums', 'blush', (c) => place(330, 900, 1, podium(c, { rx: 190, h: 90, col: '#F7ECF3' }) + place(0, -90, 0.95, oudBottle(c))) + place(590, 920, 1, podium(c, { rx: 110, h: 50, col: '#EFE6F7' }) + place(-30, -50, 1.1, rollOn(c, { liq: '#F7C6D9' })) + place(52, -50, 0.8, slimBottle(c, { liq: '#C4B5FD' })))],
  friperie: ['Friperie', 'warm', (c) => place(400, 70, 0.95, denimJacket(c, '#4C6E9E')) + place(400, 945, 0.78, stackShadow(c, 330) + foldStack(c, { w: 330, h: 74, d: 320, k: 0.45, col: '#4A6FA5', layers: 3, r: 18, top: jeansTop(c, '#4A6FA5', 330, 320) }) + place(0, -74, 0.92, foldStack(c, { w: 300, h: 44, d: 380, k: 0.45, col: '#F8FAFD', layers: 2, r: 12, top: shirtTop(c, '#F8FAFD', '#B9CDEA', 300, 380), sideCol: '#D6E1F2' })))],
  'ensembles-chez-cathy': ['Ensembles chez Cathy', 'lilac', (c) => place(400, 90, 0.92, waxSet(c, WAX_A)) + place(620, 950, 0.55, stackShadow(c, 340) + foldStack(c, { w: 340, h: 60, d: 320, k: 0.45, col: '#D8C3A0', layers: 3, r: 14 }))],
  'produits-du-maroc': ['Produits du Maroc', 'warm', (c) => place(400, 900, 1, tray(c, 300)) + place(330, 880, 1, teapot(c)) + place(560, 895, 1, teaGlass(c)) + place(635, 915, 1, teaGlass(c, { band: '#C026D3' })) + place(150, 930, 0.75, dropperBottle(c)) + arganNuts(c, [[250, 960, 10, 0], [700, 960, -20, 1]])],
  'produits-importes': ['Produits importés', 'lilac', (c) => place(560, 900, 0.95, bottleFlask(c, { col: '#E79BBF' })) + place(330, 910, 1, handbag(c, { col: '#5A1D5E' })) + place(660, 920, 0.6, miniFan(c))],
  lasalmah: ['Lasalmah', 'blush', (c) => place(370, 880, 1, giftBox(c, { w: 320, h: 230, d: 260, col: '#3B1C6E', rib: '#F6C1D6' })) + place(600, 930, 0.7, giftBox(c, { w: 280, h: 110, d: 170, col: '#C026D3', rib: '#FBCFE8', open: true, lidLean: false, tissue: '#FCE7F3', inside: place(-70, -50, 1, roundJar(c)) + place(10, -60, 1.1, roundJar(c, { col: '#F3E8FF', lid: '#E8E4F0', w: 80, h: 60 })) + place(84, -50, 1, roundJar(c, { col: '#FCE7F3' })) }))],
};
function categorySvg(slug) {
  const [name, tint, draw] = CATS[slug];
  const c = new Ctx('cat' + prefixOf(slug) + '_');
  seed('cat' + slug);
  const body = backdrop(c, { tint, arch: 'horseshoe', aw: 500, atop: 70 }) + draw(c) + vignette(c);
  return svgDoc(c, 800, 1000, `Illustration : couverture de la catégorie ${name}`, body);
}

/* ------------------------------------------------------------------ */
/* Images éditoriales                                                  */
/* ------------------------------------------------------------------ */
function zelligeBand(c, d, w) {
  const z = c.pat('zel', 28, 28, s`<rect width="28" height="28" fill="#F1E8FA"/><path d="${star8(14, 14, 10)}" fill="#7C3AED" opacity=".55"/><path d="${star8(14, 14, 5)}" fill="#F8D9E8"/><path d="M0 0L5 0L0 5ZM28 0V5L23 0ZM0 28V23L5 28ZM28 28H23L28 23Z" fill="${GOLD}"/>`);
  return s`<path d="${d}" fill="none" stroke="${z}" stroke-width="${w}"/>`;
}
/** Lanterne marocaine ajourée suspendue (lumière chaude). */
function lantern(c, x, y0, y1) {
  const g = c.lin([[0, '#F6E7BE'], [0.4, GOLD], [1, '#7E5C26']]);
  let o = s`<path d="M${x} ${y0}V${y1 - 150}" stroke="${GOLD_D}" stroke-width="2.5" stroke-dasharray="7 3"/>`;
  o += s`<ellipse cx="${x}" cy="${y1 - 60}" rx="150" ry="170" fill="${c.rad([[0, '#FFE2B0', 0.55], [1, '#FFE2B0', 0]])}"/>`;
  o += place(x, y1, 1,
    s`<path d="M0 -150L-16 -128H16Z" fill="${g}"/><path d="M-16 -128H16L40 -96H-40Z" fill="${g}"/>` +
    s`<path d="M-40 -96H40L46 -10H-46Z" fill="#FFE9C2"/>` +
    s`<path d="M-40 -96H40L46 -10H-46Z" fill="${c.pat('lan', 12, 12, s`<rect width="12" height="12" fill="${GOLD_D}"/><path d="${star8(6, 6, 4.5)}" fill="#FFF3D6"/>`)}" opacity=".9"/>` +
    s`<path d="M-40 -96L-46 -10M40 -96L46 -10M0 -96V-10" stroke="${g}" stroke-width="4"/>` +
    s`<path d="M-46 -10H46L30 18H-30Z" fill="${g}"/><circle cx="0" cy="26" r="7" fill="${g}"/>` +
    s`<ellipse cx="0" cy="-54" rx="20" ry="30" fill="#FFF6DE" opacity=".8" filter="${c.blur(8)}"/>`);
  return o;
}
function heroSvg() {
  const W = 1200, H = 1400, FY = 1060;
  const c = new Ctx('hero_');
  seed('hero');
  let o = backdrop(c, { W, H, tint: 'lilac', arch: 'none', floorY: FY, patch: false });
  // grande fenêtre de lumière projetée
  o += s`<path d="${archPath('pointed', 90, 300, 90, 640)}" transform="skewX(-10)" fill="${c.lin([[0, '#fff', 0.75], [0.7, '#fff', 0.35], [1, '#fff', 0]], 0, 0, 0, 1)}" filter="${c.blur(22)}"/>`;
  o += s`<path d="M195 90V640M90 360H300" transform="skewX(-10)" stroke="${'#E7DCFA'}" stroke-width="12" opacity=".5" filter="${c.blur(8)}"/>`;
  o += s`<path d="M250 0L1200 1300" stroke="#fff" stroke-width="260" opacity=".12" filter="${c.blur(60)}"/>`;
  // grande niche
  const x0 = 330, x1 = 990, top = 120;
  o += s`<path d="${archPath('pointed', x0 - 44, x1 + 44, top - 44, FY)}" fill="#F8F3FF"/>`;
  o += zelligeBand(c, archPath('pointed', x0 - 22, x1 + 22, top - 22, FY + 40), 26);
  o += s`<path d="${archPath('pointed', x0 - 36, x1 + 36, top - 36, FY)}" fill="none" stroke="${GOLD}" stroke-width="2.5" opacity=".7"/>`;
  o += s`<path d="${archPath('pointed', x0 - 9, x1 + 9, top - 9, FY)}" fill="none" stroke="${GOLD}" stroke-width="2.5" opacity=".7"/>`;
  const nd = archPath('pointed', x0, x1, top, FY), nid = c.shape(nd);
  o += s`<use href="#${nid}" fill="${c.lin([[0, '#C9B6EE'], [0.45, '#DCCDF6'], [1, '#EEE6FC']])}"/>`;
  o += s`<g clip-path="${c.clipUse(nid)}"><use href="#${nid}" fill="none" stroke="${PLUM}" stroke-opacity=".25" stroke-width="60" filter="${c.blur(28)}" transform="translate(-16 -10)"/>` +
    s`<ellipse cx="780" cy="560" rx="300" ry="420" fill="${c.rad([[0, '#fff', 0.5], [1, '#fff', 0]])}"/>` +
    s`<path d="M520 120L940 1060" stroke="#fff" stroke-width="120" opacity=".18" filter="${c.blur(30)}"/></g>`;
  // lanterne marocaine suspendue
  o += lantern(c, 150, 0, 430);
  // robe de prière suspendue
  o += place(660, 240, 1.18, prayerDress(c, '#C4B5FD'));
  // sol
  o += s`<rect x="-200" y="${FY - 6}" width="1600" height="12" fill="${PLUM}" opacity=".1" filter="${c.blur(6)}"/>`;
  // tapis en velours plié (pile) + chapelet
  const rugTop = s`<g clip-path="${c.clip('<rect width="420" height="330"/>')}"><g transform="translate(0 -80)">${rugArt(c, { w: 420, h: 640, col: '#7A1F3D', acc: '#E7B8C4' })}</g></g>`;
  o += place(330, 1250, 1, stackShadow(c, 420, 0.36) + foldStack(c, { w: 440, h: 110, d: 330, k: 0.42, col: '#7A1F3D', layers: 4, r: 18, top: rugTop }) + fringe(-200, 200, 0, 22, '#F2D9DE'));
  o += place(390, 1080, 0.95, tasbih(c, { col: '#F4EEE4', tassel: GOLD }));
  // parfum sur podium
  o += place(910, 1250, 1, podium(c, { rx: 170, h: 110, col: '#F4ECFA' }) + place(0, -110, 0.9, oudBottle(c)));
  o += place(1110, 1200, 1, stemVase(c, {}));
  o += place(640, 1330, 0.8, pebbles(c, '#D9CBE6'));
  o += vignette(c, W, H);
  return svgDoc(c, W, H, 'Illustration : nature morte sous une arche marocaine — robe de prière lilas suspendue, tapis de prière en velours plié, chapelet et flacon de parfum', o);
}

function storySvg() {
  const c = new Ctx('story_');
  seed('story');
  const FY = 700;
  let o = backdrop(c, { tint: 'warm', arch: 'none', floorY: FY, patch: false });
  // fenêtre en arc lumineuse
  const wd = archPath('horseshoe', 250, 550, 90, 520);
  o += s`<path d="${archPath('horseshoe', 230, 570, 70, 540)}" fill="${L('#EBDCD6', 0.3)}"/>`;
  o += s`<path d="${wd}" fill="${c.lin([[0, '#FFFFFF'], [0.6, '#FCE7F3'], [1, '#F3E8FF']], 0, 0, 0, 1)}"/>`;
  o += s`<path d="${wd}" fill="none" stroke="${D('#EBDCD6', 0.2)}" stroke-width="4"/>`;
  o += s`<path d="M400 90V520M250 330H550" stroke="${D('#EBDCD6', 0.18)}" stroke-width="5"/>`;
  o += s`<rect x="220" y="520" width="360" height="22" rx="4" fill="${vol(c, '#EFE3DD')}"/>`;
  o += s`<path d="M260 ${FY + 10}L540 ${FY + 10}L700 1000L120 1000Z" fill="#fff" opacity=".35" filter="${c.blur(24)}"/>`;
  // coin de tapis au premier plan
  o += place(330, 1090, 1.25, rugFloor(c, { w: 420, h: 640, col: '#7A1F3D', acc: '#E7B8C4', roll: 0, kx: 0.7, ky: 0.42 }));
  // pile de tissus
  o += place(520, 830, 1, stackShadow(c, 300) + foldStack(c, { w: 300, h: 40, d: 220, k: 0.55, col: '#C4B5FD', layers: 2, r: 10 }) +
    place(-6, -40, 1, foldStack(c, { w: 280, h: 36, d: 210, k: 0.55, col: '#F2C6D6', layers: 2, r: 10 })) +
    place(4, -76, 1, foldStack(c, { w: 260, h: 32, d: 200, k: 0.55, col: '#E9DCCB', layers: 2, r: 10, top: s`<rect width="260" height="210" fill="${weave(c, '#B9A88F', 0.2)}"/>` })));
  o += place(640, 840, 1, teaGlass(c));
  o += place(250, 830, 0.85, stemVase(c));
  o += vignette(c);
  return svgDoc(c, 800, 1000, 'Illustration : lumière d\'une fenêtre en arc sur des tissus pliés, un verre de thé et un coin de tapis', o);
}

function wholesaleSvg() {
  const W = 1600, H = 900, FY = 640;
  const c = new Ctx('whs_');
  seed('wholesale');
  let o = backdrop(c, { W, H, tint: 'lilac', arch: 'none', floorY: FY, patch: false });
  for (const ax of [380, 800, 1220]) {
    o += s`<path d="${archPath('horseshoe', ax - 170, ax + 170, 90, FY)}" fill="${L('#E7DCFA', 0.5)}"/>`;
    o += s`<path d="${archPath('horseshoe', ax - 150, ax + 150, 110, FY)}" fill="${c.lin([[0, '#D3C1F1'], [1, '#E9DEFB']])}"/>`;
  }
  // tapis roulés debout
  const rolled = (x, col, h, rot) => place(x, 760, 1, contact(c, 0, 0, 44, 0.3) + s`<g transform="rotate(${rot})"><rect x="-34" y="${-h}" width="68" height="${h}" rx="8" fill="${c.lin([[0, L(col, 0.3)], [0.4, col], [1, D(col, 0.45)]])}"/>` +
    s`<rect x="-34" y="${-h}" width="68" height="${h}" fill="${rugBorder(c, RUG_ACC[col])}" opacity=".45"/>` +
    s`<ellipse cx="0" cy="${-h}" rx="34" ry="12" fill="${D(col, 0.25)}"/><g fill="none" stroke="${D(col, 0.55)}" stroke-width="1.2"><ellipse cx="0" cy="${-h}" rx="24" ry="8"/><ellipse cx="0" cy="${-h}" rx="14" ry="5"/></g>` +
    fringe(-30, 30, -h, -16, '#F2E6D8', 1, 4) + '</g>');
  o += rolled(130, '#7A1F3D', 420, -6) + rolled(210, '#1F5E4E', 460, -3) + rolled(290, '#6B5B8C', 400, 2);
  // piles de vêtements pliés
  const stack = (x, y, cols) => {
    let g = stackShadow(c, 280, 0.32);
    let yy = 0;
    cols.forEach((col, i) => {
      g += place(rr(-6, 6), yy, 1, foldStack(c, { w: 270, h: 44, d: 200, k: 0.5, col, layers: 2, r: 10 }));
      yy -= 44;
    });
    return place(x, y, 1, g);
  };
  o += stack(520, 800, ['#4A1650', '#C4B5FD', '#E8A5C0', '#9D7BB0', '#F4EEE4', '#A78BFA']);
  o += stack(830, 820, ['#24325E', '#7A1F3D', '#1F5E4E', '#6B5B8C', '#D8C3A0']);
  // boîtes avec ruban
  o += place(1150, 830, 0.8, giftBox(c, { w: 320, h: 200, d: 220, col: '#6D28D9', rib: '#F6C1D6', bow: false }));
  o += place(1150, 830 - 200 * 0.8 - 6, 0.68, giftBox(c, { w: 320, h: 180, d: 220, col: '#F2C9D6', rib: '#6D28D9', bow: false }));
  o += place(1150, 830 - 200 * 0.8 - 180 * 0.68 - 4, 0.55, giftBox(c, { w: 300, h: 160, d: 200, col: '#C026D3', rib: '#FCE7F3' }));
  o += place(1420, 840, 0.75, giftBox(c, { w: 280, h: 170, d: 200, col: '#EDE4FF', rib: '#7C3AED' }));
  o += vignette(c, W, H);
  return svgDoc(c, W, H, 'Illustration : stock pour la vente en gros — tapis roulés, piles de vêtements pliés et boîtes nouées de rubans', o);
}

function promoSvg() {
  const W = 1600, H = 900, FY = 700;
  const c = new Ctx('promo_');
  seed('promo');
  let o = s`<rect x="-200" y="-200" width="2000" height="1300" fill="${c.lin([[0, '#FFF6FA'], [0.45, '#FBEAF3'], [1, '#EBDDFB']], 0, 0, 1, 0.4)}"/>`;
  o += s`<ellipse cx="300" cy="200" rx="800" ry="600" fill="${c.rad([[0, '#fff', 0.85], [1, '#fff', 0]])}"/>`;
  o += s`<path d="${archPath('pointed', 880, 1420, 70, FY)}" fill="${c.lin([[0, '#E3CBF6'], [1, '#F6DDEC']])}"/>`;
  o += s`<path d="${archPath('pointed', 860, 1440, 50, FY)}" fill="none" stroke="${GOLD}" stroke-width="2.5" opacity=".7"/>`;
  o += s`<ellipse cx="1240" cy="420" rx="260" ry="320" fill="${c.rad([[0, '#fff', 0.45], [1, '#fff', 0]])}"/>`;
  o += s`<rect x="-200" y="${FY}" width="2000" height="400" fill="${c.lin([[0, '#F6DCE8'], [1, '#EAC9DD']], 0, 0, 0, 1)}"/>`;
  o += s`<rect x="-200" y="${FY - 4}" width="2000" height="10" fill="${PLUM}" opacity=".08" filter="${c.blur(5)}"/>`;
  o += place(1150, 850, 1.1, podium(c, { rx: 200, h: 120, col: '#F4E8F8' }) + place(0, -120, 0.9, oudBottle(c)));
  o += place(1400, 860, 1, podium(c, { rx: 120, h: 60, col: '#FBEFF5' }) + place(-34, -60, 1, slimBottle(c, { liq: '#F472B6' })) + place(40, -60, 0.9, slimBottle(c, { liq: '#C4B5FD', h: 200 })));
  o += place(880, 870, 0.62, giftBox(c, { w: 320, h: 230, d: 260, col: '#3B1C6E', rib: '#F6C1D6' }));
  o += place(1530, 880, 0.75, stemVase(c));
  seed('petals');
  let pet = '';
  for (let i = 0; i < 8; i++) {
    const x = rr(760, 1560), y = rr(760, 880);
    pet += s`<ellipse cx="${x}" cy="${y}" rx="${rr(8, 13)}" ry="${rr(4, 6)}" transform="rotate(${rr(0, 180)} ${x} ${y})"/>`;
  }
  o += s`<g fill="${c.lin([[0, '#FFD1E6'], [1, '#EC4899']], 0, 0, 1, 1)}" opacity=".85">${pet}</g>`;
  o += vignette(c, W, H);
  return svgDoc(c, W, H, 'Illustration : bannière promotionnelle — flacons de parfum sur podiums et coffret cadeau sous une arche, espace libre à gauche', o);
}

/* ------------------------------------------------------------------ */
/* Écriture                                                            */
/* ------------------------------------------------------------------ */
function write(rel, content) {
  const f = join(OUT, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, content);
  return content.length;
}
const prefixes = new Set();
for (const p of P) {
  const pre = prefixOf(p.slug);
  if (prefixes.has(pre)) throw new Error('Préfixe en double : ' + pre);
  prefixes.add(pre);
}
let count = 0, total = 0;
const sizes = [];
for (const p of P) {
  if (p.flat) p.draw = () => '';
  for (const k of [1, 2, 3]) {
    const len = write(`products/${p.slug}-${k}.svg`, productSvg(p, k));
    sizes.push([`products/${p.slug}-${k}.svg`, len]);
    count++; total += len;
  }
}
for (const slug of Object.keys(CATS)) {
  const len = write(`categories/${slug}.svg`, categorySvg(slug));
  sizes.push([`categories/${slug}.svg`, len]); count++; total += len;
}
for (const [name, fn] of [['hero', heroSvg], ['story', storySvg], ['wholesale', wholesaleSvg], ['promo', promoSvg]]) {
  const len = write(`editorial/${name}.svg`, fn());
  sizes.push([`editorial/${name}.svg`, len]); count++; total += len;
}
const big = sizes.filter(([, l]) => l > 20000);
console.log(`${count} fichiers SVG écrits dans public/demo (${(total / 1024).toFixed(1)} Ko au total).`);
if (big.length) console.log('Au-delà de 20 Ko :\n' + big.map(([f, l]) => `  ${f} ${(l / 1024).toFixed(1)} Ko`).join('\n'));
