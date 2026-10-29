// Decorul floral al cartonașului „Invitație", după chenarul invitației tipărite a miresei:
// trandafiri crem / piersică / roz / vișinii, bujori, orhidee Phalaenopsis albe cu centrul
// magenta, frunze aurii și verzi, șiraguri de perle și puțin sclipici — în paleta site-ului.
//
//   public/decor/flora-{tl,tr,bl,br}.webp – cele patru colțuri (buchete diferite)
//   public/decor/edge-l.webp               – ramura de pe marginea paginii (doar desktop)
//   public/decor/garland.svg               – marginile laterale: vrej auriu cu frunze, perle,
//                                            trandafiri mici și câte o orhidee (tile vertical)
//
// Sursele pictate (buchetele cu trandafir crem și frunze aurii) stau în scripts/florals-src/;
// florile noi sunt vectoriale (scripts/florals-lib.mjs). Totul se compune într-un SVG per colț
// și se rasterizează o singură dată în WebP, deci în pagină nu există filtre sau umbre live.
// Rulează: node scripts/build-florals.mjs  [--preview <dir>  → și PNG-uri pe fundal verde]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as F from './florals-lib.mjs';

const { r2 } = F;

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const decor = (f) => here(`../public/decor/${f}`);
const previewDir = process.argv.includes('--preview') ? process.argv[process.argv.indexOf('--preview') + 1] : null;

// ── 1. Colțurile ─────────────────────────────────────────────────────────
// Toate se desenează în același cadru „colț stânga-sus" (W×H), apoi se oglindesc la locul lor.
const W = 500, H = 720, OUT_W = 420;

/** Buchetul pictat, adus în cadrul stânga-sus (oglindit), ca imagine PNG inline. */
async function painted(file, { flip = false, flop = false, scale = 1, dx = 0, dy = 0, opacity = 1 }) {
  let img = sharp(readFileSync(here(`./florals-src/${file}`)));
  if (flip) img = img.flip();
  if (flop) img = img.flop();
  const { data, info } = await img.png().toBuffer({ resolveWithObject: true });
  const w = Math.round(info.width * scale), h = Math.round(info.height * scale);
  // marginile tăiate ale picturii (dreapta / jos) se estompează, ca să nu rămână o muchie dreaptă
  const fade = (k, x2, y2, len) =>
    `<linearGradient id="f${k}" gradientUnits="userSpaceOnUse" x1="${dx}" y1="${dy}" x2="${x2}" y2="${y2}">` +
    `<stop offset="${r2(1 - 80 / len)}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<mask id="m${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#f${k})"/></mask>`;
  // …și ramurile care intră spre mijlocul cartonașului (peste text) se sting pe diagonală:
  // păstrăm ce e lângă cele două laturi (x/W + y/H < ~0.82), estompăm până la 1.05.
  const n2 = 1 / W ** 2 + 1 / H ** 2, end = 1.05 / n2;
  const diag =
    `<linearGradient id="fd" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${r2(end / W)}" y2="${r2(end / H)}">` +
    `<stop offset="${r2(0.82 / 1.05)}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<mask id="md" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fd)"/></mask>`;
  return `<defs>${fade('x', dx + w, dy, w)}${fade('y', dx, dy + h, h)}${diag}</defs>` +
    `<g mask="url(#md)"><g mask="url(#mx)"><image mask="url(#my)" href="data:image/png;base64,${data.toString('base64')}" x="${dx}" y="${dy}" width="${w}" height="${h}" opacity="${opacity}"/></g></g>`;
}

const vine = (d, w = 1.4) => `<path d="${d}" fill="none" stroke="#b8924a" stroke-width="${w}" stroke-linecap="round"/>`;
const leaves = (list) => list.map(([x, y, s, r, t]) => F.leaf(x, y, s, r, t)).join('');

/**
 * Câte o rețetă pentru fiecare colț. `orient` = cum se oglindește cadrul stânga-sus:
 * tr = flop, bl = flip, br = flip + flop.
 */
const CORNERS = {
  tl: {
    base: ['corner-bl.webp', { flip: true, scale: 1.0, dx: 0, dy: 0 }],
    build: () => [
      leaves([[150, 250, 1.1, 60, 'sage'], [260, 120, 1.0, -20, 'sage'], [120, 330, 0.9, 80], [330, 40, 0.9, -8], [200, 210, 0.8, 40]]),
      F.pearls([[[0, 380], [60, 300], [160, 200], [250, 160]], [[250, 160], [330, 130], [400, 60], [470, 40]]], 5.5),
      F.rose(46, 52, 0.85, 20, 'wine'),
      F.peony(205, 60, 0.62, 10, 'pink'),
      F.orchid(330, 92, 0.6, -12),
      F.orchid(80, 230, 0.62, 18, 'blush'),
      F.orchidBud(420, 70, 0.8, 70),
      F.orchidBud(60, 360, 0.8, 160),
      F.sparkles([[260, 200, 1], [380, 150, 0.7], [140, 300, 0.8]]),
    ],
  },
  tr: {
    base: ['corner-tr.webp', { flop: true, scale: 1.0, dx: 0, dy: 0 }],
    build: () => [
      leaves([[230, 150, 1.0, 30, 'sage'], [90, 300, 1.0, 70, 'sage'], [300, 60, 0.9, -10], [140, 380, 0.8, 95]]),
      F.pearls([[[20, 520], [40, 400], [90, 300], [190, 230]], [[190, 230], [280, 170], [360, 120], [480, 110]]], 5),
      F.rose(240, 40, 0.62, 0, 'peach'),
      F.orchid(60, 300, 0.6, 8),
      F.orchid(330, 120, 0.5, -30, 'blush'),
      F.rose(30, 400, 0.45, 0, 'blush'),
      F.orchidBud(420, 60, 0.7, 80),
      F.sparkles([[200, 260, 0.9], [120, 220, 0.6], [400, 200, 0.7]]),
    ],
  },
  bl: {
    base: ['corner-bl.webp', { flip: true, scale: 1.0, dx: 0, dy: 0 }],
    build: () => [
      leaves([[170, 240, 1.1, 50, 'sage'], [280, 90, 1.0, -15, 'sage'], [330, 30, 0.9, 0], [90, 360, 0.9, 85]]),
      F.pearls([[[0, 300], [80, 260], [140, 190], [230, 170]], [[230, 170], [320, 150], [380, 90], [490, 70]]], 5.5),
      F.peony(300, 48, 0.6, 0, 'peach'),
      F.rose(42, 270, 0.62, 20, 'wine'),
      F.orchid(210, 170, 0.56, 190), // +180°: colțul se oglindește vertical
      F.orchidBud(430, 40, 0.75, 60),
      F.sparkles([[300, 200, 1], [110, 380, 0.7]]),
    ],
  },
  br: {
    base: ['corner-tr.webp', { flop: true, scale: 1.0, dx: 0, dy: 0 }],
    build: () => [
      leaves([[220, 160, 1.0, 40, 'sage'], [80, 320, 1.0, 75, 'sage'], [310, 50, 0.9, -5], [130, 400, 0.8, 100]]),
      F.pearls([[[0, 470], [50, 360], [110, 280], [200, 240]], [[200, 240], [300, 200], [380, 100], [480, 90]]], 5),
      F.rose(40, 225, 0.72, 30, 'wine'),
      F.rose(270, 50, 0.5, 0, 'blush'),
      F.orchid(60, 300, 0.64, 200),
      F.orchid(340, 130, 0.5, 160),
      F.sparkles([[220, 290, 0.9], [420, 180, 0.7]]),
    ],
  },
};
const ORIENT = { tl: [], tr: ['flop'], bl: ['flip'], br: ['flip', 'flop'] };

async function corner(key) {
  const c = CORNERS[key];
  const base = await painted(c.base[0], c.base[1]);
  const parts = c.build();
  const defs = parts.map((p) => (typeof p === 'string' ? '' : p.defs)).join('');
  const body = parts.map((p) => (typeof p === 'string' ? p : p.svg)).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${F.sharedDefs}${defs}</defs>${base}${body}</svg>`;
  let img = sharp(Buffer.from(svg), { density: 72 });
  for (const op of ORIENT[key]) img = img[op]();
  const png = await img.png().toBuffer();
  if (previewDir) {
    await sharp({ create: { width: W, height: H, channels: 4, background: '#163a2a' } })
      .composite([{ input: png }]).png().toFile(`${previewDir}/flora-${key}.png`);
  }
  return sharp(png).resize({ width: OUT_W }).webp({ quality: 76, alphaQuality: 80, effort: 6 }).toFile(decor(`flora-${key}.webp`));
}

// ── 2. Ghirlanda laterală (SVG, tile vertical fără cusătură) ────────────────
// Vrejul și șiragul au capetele în (20,0)/(20,GH) cu aceeași tangentă → se repetă continuu.
// Pe un tile (8 × lățimea): un trandafir roz, unul mic piersică și o orhidee albă;
// între ele frunze aurii și verzi. Fără umbre (filtrele ar costa la fiecare repaint).
function garland() {
  const GH = 320;
  F.useShadows(false);
  const vinePath = `M20 0C31 54 9 106 20 160S31 266 20 ${GH}`;
  const pearlSegs = [
    [[20, 0], [6, 54], [34, 106], [20, 160]],
    [[20, 160], [6, 214], [34, 266], [20, GH]],
  ];
  const pts = F.along(pearlSegs, 6.4, 3.2).filter(([, y]) => y > 1.5 && y < GH - 1.5);
  const els = [F.rose(20, 78, 0.17, 20, 'blush'), F.orchid(20, 238, 0.15, 6), F.rose(23, 158, 0.09, 0, 'peach')];
  const lv = [
    [24, 20, 0.36, -40], [23, 26, 0.34, 215, 'sage'], [16, 112, 0.34, 205], [17, 118, 0.3, -25, 'sage'],
    [24, 190, 0.34, -35], [24, 196, 0.32, 200, 'sage'], [16, 290, 0.34, 210], [16, 284, 0.3, -30],
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 ${GH}" width="40" height="${GH}">` +
    `<defs>${F.sharedDefs.replace(/<filter[\s\S]*?<\/filter>/, '')}${els.map((e) => e.defs).join('')}</defs>` +
    `<path d="${vinePath}" fill="none" stroke="#c9a55a" stroke-width="1.1"/>` +
    leaves(lv.map(([x, y, s, r, t]) => [x, y, s, r, t ?? 'gold'])) +
    `<path d="M20 0C${pearlSegs.map((sg) => sg.slice(1).flat().join(' ')).join(' ')}" fill="none" stroke="#e8d09a" stroke-opacity=".45" stroke-width=".5"/>` +
    `<g fill="url(#pearl)">${pts.map(([x, y], i) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${i % 4 === 2 ? 1.7 : 2.25}"/>`).join('')}</g>` +
    els.map((e) => e.svg).join('') +
    `</svg>`;
  F.useShadows(true);
  writeFileSync(decor('garland.svg'), svg);
  return svg;
}

// ── 3. Ramura pentru marginea paginii (doar desktop ≥1024px) ────────────────
// Un singur fișier, lipit de marginea stângă a ecranului (în dreapta: oglindit din CSS).
// Doar elemente vectoriale, rare la capete, deci nu are muchii tăiate decât spre marginea ecranului.
async function edgeSpray() {
  const EW = 300, EH = 900;
  const vineD = 'M-10 0C60 120 20 260 70 380S40 640 90 760 60 860 30 900';
  const parts = [
    vine(vineD, 1.6),
    vine('M70 380C120 360 170 330 200 280', 1.2),
    vine('M90 760C140 740 180 700 200 650', 1.2),
    leaves([
      [30, 70, 0.6, 60], [44, 120, 0.7, -30, 'sage'], [40, 90, 0.9, 40, 'sage'], [52, 160, 0.8, -20],
      [30, 230, 0.9, 120, 'sage'], [62, 300, 0.85, 10], [40, 260, 0.8, -50], [120, 360, 0.8, -40, 'sage'],
      [160, 325, 0.7, -60], [100, 300, 0.9, -70, 'sage'], [130, 400, 0.9, 10, 'sage'], [150, 450, 0.8, 30],
      [40, 470, 0.9, 140], [70, 540, 0.9, 20, 'sage'], [110, 520, 0.8, 50], [50, 620, 0.8, 150, 'sage'],
      [80, 660, 0.7, 40], [140, 735, 0.8, -35], [175, 690, 0.7, -70, 'sage'], [60, 820, 0.8, 140], [70, 860, 0.6, 100, 'sage'],
    ]),
    F.pearls([[[0, 330], [70, 330], [150, 380], [170, 450]], [[170, 450], [190, 520], [150, 580], [70, 600]]], 5),
    F.pearls([[[0, 520], [60, 560], [70, 640], [40, 700]]], 4),
    F.orchid(186, 300, 0.42, -15),
    F.orchidBud(212, 262, 0.6, 40),
    F.rose(40, 400, 0.62, 10, 'blush'),
    F.peony(120, 440, 0.48, 0, 'peach'),
    F.rose(24, 520, 0.5, 30, 'wine'),
    F.orchid(110, 545, 0.44, 8),
    F.orchid(186, 660, 0.36, 10, 'blush'),
    F.rose(60, 740, 0.38, 0, 'cream'),
    F.orchidBud(70, 200, 0.6, 20),
    F.sparkles([[190, 400, 0.9], [230, 560, 0.7], [120, 860, 0.7], [90, 140, 0.6], [160, 620, 0.6]]),
  ];
  const defs = parts.map((p) => (typeof p === 'string' ? '' : p.defs)).join('');
  const body = parts.map((p) => (typeof p === 'string' ? p : p.svg)).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${EW}" height="${EH}"><defs>${F.sharedDefs}${defs}</defs>${body}</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  if (previewDir) {
    await sharp({ create: { width: EW, height: EH, channels: 4, background: '#163a2a' } })
      .composite([{ input: png }]).png().toFile(`${previewDir}/edge-l.png`);
  }
  return sharp(png).webp({ quality: 76, alphaQuality: 80, effort: 6 }).toFile(decor('edge-l.webp'));
}

const sizes = [];
const e = await edgeSpray();
sizes.push(`edge-l.webp ${(e.size / 1024).toFixed(1)} KB (${e.width}×${e.height})`);
const gsvg = garland();
sizes.push(`garland.svg ${(gsvg.length / 1024).toFixed(1)} KB`);
if (previewDir) {
  const tile = await sharp(Buffer.from(gsvg), { density: 288 }).png().toBuffer();
  await sharp({ create: { width: 200, height: 1280, channels: 4, background: '#163a2a' } })
    .composite([{ input: tile, left: 20, top: 0 }]).png().toFile(`${previewDir}/garland.png`);
}
for (const k of Object.keys(CORNERS)) {
  const r = await corner(k);
  sizes.push(`flora-${k}.webp ${(r.size / 1024).toFixed(1)} KB (${r.width}×${r.height})`);
}
console.log(sizes.join(' · '));
