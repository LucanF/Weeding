// Decorul floral al cartonașului „Invitație" și sigiliul plicului, din asset-urile generate pentru
// miri (new_assets/, PNG cu fundal transparent).
//
//   public/decor/border-{l,r}.webp (+ -sm) – cele două benzi florale verticale (trandafiri, orhidee,
//                                            crini, bujori, perle, crenguțe aurii): stânga și dreapta
//                                            cartonașului (tile vertical) și marginile paginii pe desktop
//   public/decor/seal.webp                 – sigiliul de ceară auriu D&D de pe plic
//   src/data/decor.json                    – dimensiunile fișierelor (pentru CSS / width/height în pagină)
//
// Benzile vin cu un „halou" galben-auriu pe conturul dinspre partea transparentă (fundalul decupat
// imperfect). Curățare: alfa erodat ~1 px (min 3×3, amestecat cu originalul ca să rămână netedă),
// pragul de jos tăiat (ceața aproape transparentă dispare) și culoarea pixelilor semitransparenți
// desaturată și întunecată proporțional cu transparența lor → conturul nu mai e o linie galbenă pe
// catifeaua verde. Crenguțele rare dinspre interior se estompează (fadeInner). Rulează: node scripts/build-florals.mjs [--preview <dir>]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const src = (f) => here(`../new_assets/${f}`);
const decor = (f) => here(`../public/decor/${f}`);
const previewDir = process.argv.includes('--preview') ? process.argv[process.argv.indexOf('--preview') + 1] : null;

const BORDERS = {
  l: 'Luxury Floral Wedding Border_new.png', // florile pe marginea din stânga
  r: 'Luxurious Floral Wedding Border_new.png', // florile pe marginea din dreapta
};
const SEAL = 'afdedef3-7a3f-4324-a9fd-6a453abf3567.png';

/** Lățimile exportate ale benzilor (px): lg ≈ 2× pe desktop, sm pentru telefoane. */
const BORDER_W = { lg: 520, sm: 256 };
const WEBP = { quality: 74, alphaQuality: 80, effort: 6, smartSubsample: true };

/** RGBA brut; alfa foarte mic → 0 (resturi de „glow" de la decupare). */
async function load(file, extract) {
  let img = sharp(src(file)).ensureAlpha();
  if (extract) img = img.extract(extract);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] < 8) data[i] = 0;
  return { data, w: info.width, h: info.height };
}

/**
 * Scoate haloul de pe contur: alfa erodat 1 px (min 3×3, ⅔ min + ⅓ original), apoi întins între
 * LO și HI (sub LO → 0), iar culoarea pixelilor de pe contur e desaturată (DESAT) și întunecată
 * (DARK) proporțional cu cât sunt de transparenți — dispare franjul galben/roșu saturat.
 */
function despill({ data, w, h }, { lo = 28, hi = 235, desat = 0.85, dark = 0.4 } = {}) {
  const N = w * h;
  const al = new Uint8Array(N);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let m = 255;
      for (let j = -1; j <= 1; j++) {
        const Y = y + j;
        if (Y < 0 || Y >= h) continue;
        for (let i = -1; i <= 1; i++) {
          const X = x + i;
          if (X < 0 || X >= w) continue;
          const v = data[(Y * w + X) * 4 + 3];
          if (v < m) m = v;
        }
      }
      const p = y * w + x;
      al[p] = Math.round((m * 2 + data[p * 4 + 3]) / 3);
    }
  const out = Buffer.alloc(N * 4);
  for (let p = 0; p < N; p++) {
    const a0 = al[p];
    const a = a0 <= lo ? 0 : a0 >= hi ? 255 : Math.round(((a0 - lo) * 255) / (hi - lo));
    if (!a) continue;
    const s = 1 - a / 255;
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    const Y = 0.3 * r + 0.59 * g + 0.11 * b;
    const k = desat * s, d = 1 - dark * s;
    out[p * 4] = Math.round((r + (Y - r) * k) * d);
    out[p * 4 + 1] = Math.round((g + (Y - g) * k) * d);
    out[p * 4 + 2] = Math.round((b + (Y - b) * k) * d);
    out[p * 4 + 3] = a;
  }
  return { data: out, w, h };
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

const toSharp = ({ data, w, h }) => sharp(data, { raw: { width: w, height: h, channels: 4 } });
async function cropped(img, th) {
  const b = bbox(img, th);
  const buf = await toSharp(img).extract(b).png().toBuffer();
  return { buf, ...b };
}

async function preview(name, buf) {
  if (!previewDir) return;
  const m = await sharp(buf).metadata();
  await sharp({ create: { width: m.width, height: m.height, channels: 3, background: '#0b2418' } })
    .composite([{ input: buf }]).png().toFile(`${previewDir}/${name}.png`);
}

const out = {};
const log = [];
async function save(name, pipeline) {
  const r = await pipeline.webp(WEBP).toFile(decor(name));
  log.push(`${name} ${(r.size / 1024).toFixed(1)} KB (${r.width}×${r.height})`);
  return { w: r.width, h: r.height };
}

/**
 * Crenguțele și perlele rare dinspre interior se estompează (FADE: fracțiuni din lățime, măsurate
 * de la marginea cu flori) → pe telefon nu se mai văd pete de perle în spatele textului.
 * Florile dese ocupă cam primele 55–60 % din lățime și rămân neatinse.
 */
const FADE = [0.58, 0.96];
function fadeInner(data, w, h, side) {
  for (let x = 0; x < w; x++) {
    const t = (side === 'l' ? x : w - 1 - x) / (w - 1);
    const u = Math.min(1, Math.max(0, (t - FADE[0]) / (FADE[1] - FADE[0])));
    const f = 1 - u * u * (3 - 2 * u); // smoothstep
    if (f === 1) continue;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4 + 3;
      data[i] = Math.round(data[i] * f);
    }
  }
}

// ── 1. Benzile florale (stânga / dreapta) ───────────────────────────────
// Ambele au aceeași lățime de decupaj (cea mai lată dintre ele), lipită de marginea cu flori,
// și toată înălțimea (sus/jos florile sunt tăiate de marginea imaginii → se pot repeta vertical).
{
  const imgs = {};
  for (const [k, file] of Object.entries(BORDERS)) imgs[k] = despill(await load(file));
  const boxes = Object.fromEntries(Object.entries(imgs).map(([k, img]) => [k, bbox(img)]));
  const cw = Math.max(boxes.l.left + boxes.l.width, imgs.r.w - boxes.r.left);
  for (const [k, img] of Object.entries(imgs)) {
    const area = { left: k === 'l' ? 0 : img.w - cw, top: 0, width: cw, height: img.h };
    const strip = await toSharp(img).extract(area).raw().toBuffer();
    fadeInner(strip, cw, img.h, k);
    const buf = await toSharp({ data: strip, w: cw, h: img.h }).png().toBuffer();
    await preview(`border-${k}`, buf);
    const lg = await save(`border-${k}.webp`, sharp(buf).resize({ width: BORDER_W.lg }));
    const sm = await save(`border-${k}-sm.webp`, sharp(buf).resize({ width: BORDER_W.sm }));
    out[`border-${k}`] = { ...lg, sm: sm.w, smh: sm.h };
  }
}

// ── 2. Sigiliul de ceară (plicul din hero) ──────────────────────────────
{
  const c = await cropped(await load(SEAL), 24);
  await preview('seal', c.buf);
  // afișat la 4.75–7 rem (76–112 px) → 240 px ≈ 2–3×; e deasupra fold-ului, deci mic
  out.seal = await save('seal.webp', sharp(c.buf).resize({ width: 240 }));
}

writeFileSync(here('../src/data/decor.json'), JSON.stringify(out, null, 2) + '\n');
console.log(log.join('\n'));
