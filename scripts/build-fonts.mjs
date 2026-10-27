// Construiește fonturile self-hosted (woff2) în public/fonts/ din pachetele @fontsource.
// Fiecare familie = un fișier „latin" + un supliment minuscul doar cu diacriticele
// românești (ă ș ț + variantele cu sedilă), încărcat prin unicode-range.
// Pinyon Script e redus la glifele „D" și „&" (monogramă) — ~2 KB.
// Rulează:  npm run fonts
import subsetFont from 'subset-font';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = (p) => path.join(root, 'node_modules', p);
const out = path.join(root, 'public/fonts');
await mkdir(out, { recursive: true });

const RO = 'ĂăȘșȚțŞşŢţ';
// Latin de bază + Latin-1 + punctuație tipografică folosită (– — „ ” ’ … · •)
let LATIN = '';
for (let c = 0x20; c <= 0x7e; c++) LATIN += String.fromCharCode(c);
for (let c = 0xa0; c <= 0xff; c++) LATIN += String.fromCharCode(c);
LATIN += '–—‘’‚“”„…·•→←↑↓€×';

// Fonturile de text (Great Vibes, Alex Brush, Cormorant) se construiesc cu scripts/build-fonts.py.
const jobs = [
  ['@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff2', 'pinyon-mono.woff2', 'D&'],
];

for (const [src, dest, text] of jobs) {
  const buf = await readFile(nm(src));
  const sub = await subsetFont(buf, text, { targetFormat: 'woff2' });
  await writeFile(path.join(out, dest), sub);
  console.log(`${dest.padEnd(26)} ${(sub.length / 1024).toFixed(1)} KB`);
}
