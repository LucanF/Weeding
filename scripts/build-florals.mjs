// Decorul floral al cartonașului „Invitație" (inspirat din chenarul invitației tipărite:
// trandafiri roz / vișinii, frunze aurii, șiraguri de perle), în paleta site-ului.
//
//   public/decor/garland.svg    – vrej auriu + frunze aurii + șirag de perle; tile vertical
//                                 fără cusătură, pus pe marginile laterale ale cartonașului.
//   public/decor/corner-tl.webp – buchetul din corner-bl.webp, oglindit vertical, trandafir roz pudrat
//   public/decor/corner-br.webp – buchetul din corner-tr.webp, oglindit vertical, trandafir vișiniu
//
// Colțurile noi refolosesc pictura existentă (același stil ca TR/BL), doar recolorată: numai
// petalele crem din interiorul unor elipse date (trandafir, flori mici) primesc noua nuanță,
// frunzele verzi/aurii rămân neatinse. Rulează: node scripts/build-florals.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const decor = (f) => fileURLToPath(new URL(`../public/decor/${f}`, import.meta.url));
const r2 = (n) => Math.round(n * 100) / 100;

// ── 1. Ghirlanda (SVG, ~3 KB) ─────────────────────────────────────────────
// Bézier cubic → puncte egal distanțate (pentru perle).
function along(segs, gap, offset = 0) {
  const pts = [];
  let acc = gap - offset;
  for (const [p0, p1, p2, p3] of segs) {
    let prev = p0;
    for (let i = 1; i <= 600; i++) {
      const t = i / 600, u = 1 - t;
      const x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0];
      const y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1];
      acc += Math.hypot(x - prev[0], y - prev[1]);
      prev = [x, y];
      if (acc >= gap) {
        pts.push([x, y]);
        acc = 0;
      }
    }
  }
  return pts;
}
// vrejul și șiragul au capetele în (20,0)/(20,200) cu aceeași tangentă → se repetă continuu
const vine = 'M20 0C31 34 9 66 20 100S31 166 20 200';
const pearlPath = [
  [[20, 0], [7, 34], [33, 66], [20, 100]],
  [[20, 100], [7, 134], [33, 166], [20, 200]],
];
const leaf = (x, y, rot, s) =>
  `<use href="#l" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"/>`;
const leaves = [
  [24, 18, -40, 0.42], [23, 22, 215, 0.4],
  [16, 74, 205, 0.4], [17, 70, -25, 0.36],
  [24, 120, -35, 0.4], [24, 126, 200, 0.38],
  [16, 172, 210, 0.4], [16, 168, -30, 0.34],
];
const pearls = along(pearlPath, 6.4, 3.2)
  .filter(([, y]) => y > 1 && y < 199) // fără perle tăiate la cusătura tile-ului
  .map(([x, y], i) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${i % 4 === 2 ? 1.7 : 2.25}"/>`)
  .join('');
const garland = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 200" width="40" height="200">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e7bd"/><stop offset=".5" stop-color="#c9a55a"/><stop offset="1" stop-color="#8f6c2c"/></linearGradient>
<radialGradient id="p" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fffdf6"/><stop offset=".5" stop-color="#eee3cf"/><stop offset=".9" stop-color="#b6a483"/><stop offset="1" stop-color="#8e7d62"/></radialGradient>
<symbol id="l" overflow="visible"><path d="M0 0C9-9 26-10 38 0 26 10 9 9 0 0Z" fill="url(#g)"/><path d="M2 0Q19-1.2 35 0" fill="none" stroke="#8f6c2c" stroke-opacity=".7" stroke-width=".9"/></symbol>
</defs>
<path d="${vine}" fill="none" stroke="#c9a55a" stroke-width="1.1"/>
${leaves.map((l) => leaf(...l)).join('')}
<path d="M20 0C${pearlPath.map((seg) => seg.slice(1).flat().join(' ')).join(' ')}" fill="none" stroke="#e8d09a" stroke-opacity=".45" stroke-width=".5"/>
<g fill="url(#p)">${pearls}</g>
</svg>
`.replace(/\n(?!$)/g, '');
writeFileSync(decor('garland.svg'), garland);

// ── 2. Colțuri recolorate (WebP) ─────────────────────────────────────────
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RAMPS = {
  blush: [[0.3, '#7a2c3a'], [0.6, '#c46d77'], [0.8, '#eeb3a9'], [1, '#fff1eb']],
  wine: [[0.3, '#2c0410'], [0.6, '#741629'], [0.8, '#ad3447'], [1, '#e9a0a8']],
};
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function ramp(stops, L) {
  if (L <= stops[0][0]) return hex(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (L <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i];
      const t = (L - a) / (b - a), A = hex(ca), B = hex(cb);
      return A.map((v, k) => v + (B[k] - v) * t);
    }
  }
  return hex(stops.at(-1)[1]);
}

/** zones: elipse [cx, cy, rx, ry] în coordonatele imaginii sursă (înainte de flip). */
async function recolor({ src, out, tone, zones, width }) {
  const { data, info } = await sharp(decor(src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W } = info;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const px = (i / 4) % W, py = Math.floor(i / 4 / W);
    let zone = 0;
    for (const [cx, cy, rx, ry] of zones) {
      const d = Math.hypot((px - cx) / rx, (py - cy) / ry);
      zone = Math.max(zone, 1 - smooth(0.85, 1, d));
    }
    if (zone <= 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    // petale: luminoase, puțin saturate, nu verzi; staminele (galben intens) rămân aurii
    const w = zone * smooth(0.3, 0.45, L) * (1 - smooth(85, 120, chroma)) * (1 - smooth(-6, 6, g - r));
    if (w <= 0) continue;
    const c = ramp(RAMPS[tone], L);
    data[i] = r + (c[0] - r) * w;
    data[i + 1] = g + (c[1] - g) * w;
    data[i + 2] = b + (c[2] - b) * w;
  }
  // oglindit vertical: trandafirul trece în celălalt colț de pe aceeași latură
  const buf = await sharp(data, { raw: info }).flip().png().toBuffer();
  return sharp(buf).resize({ width }).webp({ quality: 78, alphaQuality: 80, effort: 6 }).toFile(decor(out));
}

const tl = await recolor({
  src: 'corner-bl.webp',
  out: 'corner-tl.webp',
  tone: 'blush',
  width: 340,
  zones: [
    [140, 548, 142, 122],
    [334, 596, 64, 64],
  ],
});
const br = await recolor({
  src: 'corner-tr.webp',
  out: 'corner-br.webp',
  tone: 'wine',
  width: 340,
  zones: [
    [312, 125, 112, 100],
    [118, 86, 48, 50],
    [374, 240, 48, 50],
  ],
});
console.log(`garland.svg ${garland.length} B · corner-tl.webp ${tl.size} B (${tl.width}×${tl.height}) · corner-br.webp ${br.size} B (${br.width}×${br.height})`);
