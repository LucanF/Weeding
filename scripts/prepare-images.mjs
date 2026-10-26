// Generează din pozele „sursă" din src/assets/photos/:
//  - crop-uri portret pentru mobil (art direction) în src/assets/photos/crops/
//  - imaginea og:image 1200×630 în public/og-image.jpg
//  - placeholder-e LQIP (data URI mici) în src/data/lqip.json
// Rulează:  npm run images   (după ce înlocuiești pozele)
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photos = path.join(root, 'src/assets/photos');
const crops = path.join(photos, 'crops');
await mkdir(crops, { recursive: true });

/** Decupează o fereastră definită în procente (0–1) din imagine. */
async function crop(file, out, { cx, top = 0, ratio, height = 1 }) {
  const img = sharp(path.join(photos, file));
  const { width: W, height: H } = await img.metadata();
  const h = Math.round(H * height);
  const w = Math.min(W, Math.round(h * ratio));
  const left = Math.max(0, Math.min(W - w, Math.round(W * cx - w / 2)));
  const t = Math.max(0, Math.min(H - h, Math.round(H * top)));
  await img
    .extract({ left, top: t, width: w, height: h })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(crops, out));
  console.log(`crop ${out}: ${w}×${h}`);
}

// Hero mobil: cuplul din poza „portret" e în dreapta (x≈45–90%).
await crop('portret.jpg', 'hero-mobile.jpg', { cx: 0.66, ratio: 0.66 });
// RSVP mobil: prim-planul intim, fețele în centru-dreapta.
await crop('intim.jpg', 'rsvp-mobile.jpg', { cx: 0.47, ratio: 0.7 });
// Final mobil: sărutul de lângă arcadă (stânga-centru).
await crop('arcada.jpg', 'final-mobile.jpg', { cx: 0.36, ratio: 0.7 });

// og:image 1200×630 din poza „portret", cu o vignetă discretă.
{
  const vignette = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs><radialGradient id="v" cx="62%" cy="45%" r="75%">
        <stop offset="55%" stop-color="#0E0D0A" stop-opacity="0"/>
        <stop offset="100%" stop-color="#0E0D0A" stop-opacity=".55"/>
      </radialGradient></defs>
      <rect width="1200" height="630" fill="url(#v)"/>
    </svg>`,
  );
  await sharp(path.join(photos, 'portret.jpg'))
    .extract({ left: 380, top: 40, width: 1668, height: 876 })
    .resize(1200, 630)
    .composite([{ input: vignette }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(root, 'public/og-image.jpg'));
  console.log('og-image.jpg 1200×630');
}

// LQIP: miniaturi de ~20px, ca data URI WebP.
const lqip = {};
for (const name of ['civila', 'arcada', 'inel', 'intim', 'apus', 'portret']) {
  const buf = await sharp(path.join(photos, `${name}.jpg`))
    .resize(20)
    .webp({ quality: 40 })
    .toBuffer();
  lqip[name] = `data:image/webp;base64,${buf.toString('base64')}`;
}
await writeFile(path.join(root, 'src/data/lqip.json'), JSON.stringify(lqip, null, 2) + '\n');
console.log('lqip.json');
