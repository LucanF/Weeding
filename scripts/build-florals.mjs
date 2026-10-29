// Decorul floral al cartonașului „Invitație" și sigiliul plicului, din asset-urile fotorealiste
// generate pentru miri (new_assets/, PNG 1536×1024 cu fundal transparent): trandafiri crem /
// piersică / roz / vișinii, bujori, orhidee Phalaenopsis albe cu centrul magenta, frunze aurii
// și verzi, perle — aceeași paletă ca invitația tipărită.
//
//   public/decor/flora-{tl,tr,bl,br}.webp (+ -sm) – cele patru colțuri (patru buchete diferite,
//                                                    deja desenate pentru colțul lor, fără oglindire)
//   public/decor/garland.webp                      – marginile laterale: cele două ghirlande verticale
//                                                    din planșa de clipart, una sub alta (tile vertical)
//   public/decor/edge-{l,r}.webp                   – ramurile de pe marginile paginii (doar desktop):
//                                                    cele două ghirlande orizontale din planșă, rotite
//   public/decor/seal.webp                         – sigiliul de ceară auriu D&D de pe plic
//   src/data/decor.json                            – dimensiunile fișierelor (pentru width/height în pagină)
//
// Pași: canalul alfa sub ~3% devine 0 (fără ceață), se decupează la conținut, se micșorează la
// ~2× mărimea afișată și se exportă WebP. Rulează: node scripts/build-florals.mjs [--preview <dir>]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const src = (f) => here(`../new_assets/${f}`);
const decor = (f) => here(`../public/decor/${f}`);
const previewDir = process.argv.includes('--preview') ? process.argv[process.argv.indexOf('--preview') + 1] : null;

const SHEET = 'd21f88c8-3a20-4f62-8c23-ec75c2694b89.png';
const CORNERS = {
  tl: '8155ab97-9f96-4668-bfe7-c9dbc67ce248.png',
  tr: 'Romantic Floral Corner Cascade.png',
  bl: 'Luxurious Floral Corner with Pearls and Gold.png',
  br: 'Romantic Ivory and Gold Floral Corner.png',
};
const SEAL = 'afdedef3-7a3f-4324-a9fd-6a453abf3567.png';

/**
 * Colțurile au flori de aceeași mărime în toate cele patru surse (trandafirul crem ≈ 300 px),
 * deci le scalăm cu același factor → în pagină florile au aceeași mărime în fiecare colț.
 * LG ≈ 2× pe desktop (colț ≈ 0.26 px CSS / px sursă), SM pentru telefoane.
 */
const SCALE = { lg: 0.55, sm: 0.32 };
const WEBP = { quality: 74, alphaQuality: 80, effort: 6, smartSubsample: true };

/** RGBA brut; alfa foarte mic → 0 (resturi de „glow" de la decupare). */
async function load(file, extract) {
  let img = sharp(src(file)).ensureAlpha();
  if (extract) img = img.extract(extract);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] < 8) data[i] = 0;
  return { data, w: info.width, h: info.height };
}

/** Dreptunghiul care conține pixelii cu alfa > prag. */
function bbox({ data, w, h }, th = 12) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > th) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/**
 * Păstrează doar „insula" de pixeli care conține punctul (sx, sy) – pentru planșa de clipart,
 * unde elementele vecine (crenguțe, frunze) intră în dreptunghiul ghirlandei.
 * Componente conexe pe o grilă de 4 px, cu o margine de o celulă (marginile moi rămân întregi).
 */
function isolate(img, sx, sy) {
  const { data, w, h } = img;
  const S = 4, gw = Math.ceil(w / S), gh = Math.ceil(h / S);
  const grid = new Uint8Array(gw * gh);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 24) grid[((y / S) | 0) * gw + ((x / S) | 0)] = 1;
  const seen = new Uint8Array(gw * gh);
  let start = ((sy / S) | 0) * gw + ((sx / S) | 0);
  if (!grid[start]) throw new Error(`isolate: punctul (${sx},${sy}) e transparent`);
  const stack = [start];
  seen[start] = 1;
  while (stack.length) {
    const p = stack.pop();
    const x = p % gw, y = (p / gw) | 0;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const X = x + i, Y = y + j;
        if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue;
        const q = Y * gw + X;
        if (grid[q] && !seen[q]) {
          seen[q] = 1;
          stack.push(q);
        }
      }
  }
  // o celulă de margine în jurul insulei, ca pixelii semitransparenți de pe contur să rămână
  const keep = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++)
      if (seen[y * gw + x])
        for (let j = -1; j <= 1; j++)
          for (let i = -1; i <= 1; i++) {
            const X = x + i, Y = y + j;
            if (X >= 0 && Y >= 0 && X < gw && Y < gh) keep[Y * gw + X] = 1;
          }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (!keep[((y / S) | 0) * gw + ((x / S) | 0)]) data[(y * w + x) * 4 + 3] = 0;
  return img;
}

const toSharp = ({ data, w, h }) => sharp(data, { raw: { width: w, height: h, channels: 4 } });
async function cropped(img, th) {
  const b = bbox(img, th);
  const buf = await toSharp(img).extract(b).png().toBuffer();
  return { buf, ...b };
}

async function preview(name, buf) {
  if (!previewDir) return;
  const m = await sharp(buf).metadata();
  await sharp({ create: { width: m.width, height: m.height, channels: 3, background: '#163a2a' } })
    .composite([{ input: buf }]).png().toFile(`${previewDir}/${name}.png`);
}

const out = {};
const log = [];
async function save(name, pipeline) {
  const r = await pipeline.webp(WEBP).toFile(decor(name));
  log.push(`${name} ${(r.size / 1024).toFixed(1)} KB (${r.width}×${r.height})`);
  return { w: r.width, h: r.height };
}

// ── 1. Colțurile ─────────────────────────────────────────────────────────
for (const [key, file] of Object.entries(CORNERS)) {
  const c = await cropped(await load(file));
  await preview(`flora-${key}`, c.buf);
  const lg = await save(`flora-${key}.webp`, sharp(c.buf).resize({ width: Math.round(c.width * SCALE.lg) }));
  const sm = await save(`flora-${key}-sm.webp`, sharp(c.buf).resize({ width: Math.round(c.width * SCALE.sm) }));
  // `src` = lățimea decupajului în pixeli-sursă: din ea se calculează mărimea afișată în CSS
  out[`flora-${key}`] = { ...lg, sm: sm.w, src: c.width };
}

// ── 2. Ghirlanda laterală: cele două șiruri verticale din planșă, unul sub altul ──────────
{
  const strands = [];
  for (const [x0, x1] of [[1300, 1404], [1418, 1530]]) {
    const s = await cropped(await load(SHEET, { left: x0, top: 0, width: x1 - x0, height: 1024 }));
    strands.push(s);
  }
  // aceeași lățime de tile; fiecare șir centrat pe axa vrejului
  const TW = 112, GAP = 6;
  const TH = strands.reduce((a, s) => a + s.height + GAP, 0);
  const tile = await sharp({ create: { width: TW, height: TH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(
      strands.map((s, i) => ({
        input: s.buf,
        left: Math.round((TW - s.width) / 2),
        top: i ? strands[0].height + GAP : 0,
      })),
    )
    .png()
    .toBuffer();
  await preview('garland', tile);
  // pe pagină tile-ul are 2.5rem (40 px) → 88 px = 2.2×
  out.garland = await save('garland.webp', sharp(tile).resize({ width: 88 }));
}

// ── 3. Ramurile de pe marginile paginii: ghirlandele orizontale din planșă, rotite vertical ──
{
  const swags = {
    // [zona din planșă, un punct de pe ghirlandă, rotație]
    'edge-l': [{ left: 20, top: 700, width: 548, height: 316 }, [270, 880 - 700], 90],
    'edge-r': [{ left: 520, top: 700, width: 770, height: 316 }, [800, 880 - 700], -90],
  };
  for (const [name, [area, [sx, sy], rot]] of Object.entries(swags)) {
    const img = isolate(await load(SHEET, area), sx - area.left, sy);
    const c = await cropped(img);
    const rotated = await sharp(c.buf).rotate(rot).png().toBuffer();
    await preview(name, rotated);
    out[name] = await save(`${name}.webp`, sharp(rotated));
  }
}

// ── 4. Sigiliul de ceară (plicul din hero) ──────────────────────────────
{
  const c = await cropped(await load(SEAL), 24);
  await preview('seal', c.buf);
  // afișat la 4.75–7 rem (76–112 px) → 240 px ≈ 2–3×; e deasupra fold-ului, deci mic
  out.seal = await save('seal.webp', sharp(c.buf).resize({ width: 240 }));
}

writeFileSync(here('../src/data/decor.json'), JSON.stringify(out, null, 2) + '\n');
console.log(log.join('\n'));
