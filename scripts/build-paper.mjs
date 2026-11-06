// Textura de hârtie a plicului din hero, generată procedural (fără imagini descărcate):
//
//   public/decor/paper.webp – tile 512×512, gri (128 = neutru), se repetă fără cusături.
//
// Straturi: „nori" de fibre (zgomot periodic pe mai multe octave, ca flocularea pastei de hârtie),
// granulație fină și fibre (curbe scurte, subțiri, mai deschise sau mai închise, ușor orientate pe
// orizontală, ca direcția de fabricație). Totul e calculat pe tor (coordonate modulo 512), deci
// marginile se potrivesc. În CSS se amestecă peste verde cu background-blend-mode: soft-light
// (gri 128 nu schimbă nimic, mai deschis luminează, mai închis întunecă).
// Rulează: node scripts/build-paper.mjs [--preview <fișier.png>]
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const N = 512;
const out = fileURLToPath(new URL('../public/decor/paper.webp', import.meta.url));
const previewAt = process.argv.indexOf('--preview');
const preview = previewAt > 0 ? process.argv[previewAt + 1] : null;

/** PRNG determinist (mulberry32): același fișier la fiecare rulare. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(20270529);

/** Zgomot de valoare periodic (perioada = `cells` celule pe latura tile-ului), interpolare smoothstep. */
function valueNoise(cells, sy = 1) {
  const cx = cells;
  const cy = cells * sy;
  const g = new Float32Array(cx * cy).map(() => r() * 2 - 1);
  const f = new Float32Array(N * N);
  const s = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < N; y++) {
    const fy = (y / N) * cy;
    const y0 = Math.floor(fy);
    const ty = s(fy - y0);
    const y1 = (y0 + 1) % cy;
    for (let x = 0; x < N; x++) {
      const fx = (x / N) * cx;
      const x0 = Math.floor(fx);
      const tx = s(fx - x0);
      const x1 = (x0 + 1) % cx;
      const a = g[y0 * cx + x0] + (g[y0 * cx + x1] - g[y0 * cx + x0]) * tx;
      const b = g[y1 * cx + x0] + (g[y1 * cx + x1] - g[y1 * cx + x0]) * tx;
      f[y * N + x] = a + (b - a) * ty;
    }
  }
  return f;
}

const img = new Float32Array(N * N);
// 1. nori (flocularea): octave joase; cele medii ușor alungite pe orizontală (sy = 2)
for (const [cells, amp, sy] of [
  [4, 3.5, 1],
  [8, 3, 1],
  [16, 2.6, 2],
  [32, 2.2, 2],
  [64, 1.8, 1],
]) {
  const f = valueNoise(cells, sy);
  for (let i = 0; i < img.length; i++) img[i] += f[i] * amp;
}
// 2. granulație fină (aproape per pixel)
for (let i = 0; i < img.length; i++) img[i] += (r() + r() + r() - 1.5) * 4.5;

// 3. fibre: curbe scurte cu antialiasing, desenate pe tor
function splat(x, y, v, w) {
  // pată de ~1 px (biliniar), w = grosimea (0.5–1.5)
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ws = [
    [0, 0, (1 - fx) * (1 - fy)],
    [1, 0, fx * (1 - fy)],
    [0, 1, (1 - fx) * fy],
    [1, 1, fx * fy],
  ];
  for (const [dx, dy, k] of ws) {
    const X = (((ix + dx) % N) + N) % N;
    const Y = (((iy + dy) % N) + N) % N;
    img[Y * N + X] += v * k * w;
  }
}
function fiber({ len, light, amp, width }) {
  let x = r() * N;
  let y = r() * N;
  // orientare: mai multe aproape de orizontală (direcția de fabricație)
  let a = (r() < 0.6 ? (r() - 0.5) * 0.9 : r() * Math.PI) + (r() < 0.5 ? 0 : Math.PI);
  const bend = (r() - 0.5) * 0.012;
  const steps = Math.round(len * 2);
  for (let i = 0; i < steps; i++) {
    a += bend + (r() - 0.5) * 0.03;
    x += Math.cos(a) * 0.5;
    y += Math.sin(a) * 0.5;
    // capetele se subțiază
    const t = i / steps;
    const taper = Math.sin(Math.PI * t) ** 0.6;
    const v = (light ? 1 : -1) * amp * taper;
    splat(x, y, v, width);
    if (width > 1) splat(x + Math.sin(a) * 0.7, y - Math.cos(a) * 0.7, v * 0.5, width - 0.5);
  }
}
for (let i = 0; i < 1600; i++) fiber({ len: 5 + r() * 16, light: r() < 0.6, amp: 3 + r() * 6, width: 0.6 + r() * 0.5 });
for (let i = 0; i < 160; i++) fiber({ len: 20 + r() * 45, light: r() < 0.7, amp: 3 + r() * 5, width: 0.8 + r() * 0.6 });

// la 8 biți, centrat pe 128 (neutru pentru soft-light)
let mean = 0;
for (const v of img) mean += v;
mean /= img.length;
const px = Buffer.alloc(N * N);
for (let i = 0; i < img.length; i++) px[i] = Math.max(0, Math.min(255, Math.round(128 + (img[i] - mean) * 1.35)));

const raw = { raw: { width: N, height: N, channels: 1 } };
await sharp(px, raw).toColourspace('b-w').webp({ quality: 62, effort: 6 }).toFile(out);
if (preview) {
  // 2×2 tile-uri, ca să se vadă dacă are cusături
  const tile = await sharp(px, raw).png().toBuffer();
  await sharp({ create: { width: N * 2, height: N * 2, channels: 3, background: '#808080' } })
    .composite([0, 1, 2, 3].map((k) => ({ input: tile, left: (k % 2) * N, top: Math.floor(k / 2) * N })))
    .png()
    .toFile(preview);
}
const { size } = await sharp(out).metadata().then(() => import('node:fs').then((fs) => fs.statSync(out)));
console.log(`paper.webp: ${N}×${N}, ${(size / 1024).toFixed(1)} KB`);
