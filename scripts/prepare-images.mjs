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

// Hero mobil: cuplul din poza „hero" (bănci albastre) e în centru-stânga (x≈38–60%).
await crop('hero.jpg', 'hero-mobile.jpg', { cx: 0.49, ratio: 0.66 }); // sursă 2048×1366, cuplu ≈ 49%
// RSVP mobil: prim-planul intim, fețele în centru-dreapta.
await crop('intim.jpg', 'rsvp-mobile.jpg', { cx: 0.47, ratio: 0.7 });
// Final mobil: sărutul de lângă arcadă (stânga-centru).
await crop('arcada.jpg', 'final-mobile.jpg', { cx: 0.36, ratio: 0.7 });
// „Prima privire" (2017, turnul): cuplul stă jos-centru (x≈300–670, capetele la y≈650 din 1183),
// sub mult cer. Fereastră 4:5 de 540×675 px, lipită de marginea de jos și centrată pe ei.
// Originalul rămâne neatins (îl folosește doar acest crop).
await crop('prima-privire.jpg', 'prima-privire-cuplu.jpg', { cx: 0.525, top: 1, ratio: 0.8, height: 0.5706 });

// og:image 1200×630 din poza „portret", cu o vignetă discretă.
{
  const vignette = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs><radialGradient id="v" cx="48%" cy="55%" r="75%">
        <stop offset="55%" stop-color="#0E0D0A" stop-opacity="0"/>
        <stop offset="100%" stop-color="#0E0D0A" stop-opacity=".55"/>
      </radialGradient></defs>
      <rect width="1200" height="630" fill="url(#v)"/>
    </svg>`,
  );
  await sharp(path.join(photos, 'hero.jpg'))
    .extract({ left: 0, top: 190, width: 2048, height: 1075 })
    .resize(1200, 630)
    .composite([{ input: vignette }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(root, 'public/og-image.jpg'));
  console.log('og-image.jpg 1200×630');
}

// LQIP: miniaturi de ~20px, ca data URI WebP.
const lqip = {};
const lqipFiles = {
  civila: 'civila', arcada: 'arcada', inel: 'inel', intim: 'intim', apus: 'apus', portret: 'portret',
  primaPrivire: 'crops/prima-privire-cuplu',
  civilaParc: 'civila-parc',
  primulAcasa: 'primul-acasa',
  intrebarea: 'intrebarea',
  galerieAlee: 'galerie-alee',
  galerieImbratisare: 'galerie-imbratisare',
  galerieArcadaUmbra: 'galerie-arcada-umbra',
  galeriePortretSezut: 'galerie-portret-sezut',
  galeriePrivire: 'galerie-privire',
};
for (const [name, file] of Object.entries(lqipFiles)) {
  const buf = await sharp(path.join(photos, `${file}.jpg`))
    .resize(20)
    .webp({ quality: 40 })
    .toBuffer();
  lqip[name] = `data:image/webp;base64,${buf.toString('base64')}`;
}
await writeFile(path.join(root, 'src/data/lqip.json'), JSON.stringify(lqip, null, 2) + '\n');
console.log('lqip.json');
