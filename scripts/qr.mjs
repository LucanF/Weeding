// Generează un cod QR (SVG) pentru URL-ul invitației.
// Utilizare:  npm run qr -- https://diana-si-dragos.netlify.app [fișier.svg] [--level Q]
import QRCode from 'qrcode';
import { writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const li = args.indexOf('--level');
const level = li >= 0 ? String(args.splice(li, 2)[1]).toUpperCase() : 'Q';
const [url, out = 'qr-invitatie.svg'] = args;

if (!url || !/^https?:\/\//i.test(url)) {
  console.error('Utilizare: npm run qr -- <URL complet, ex. https://exemplu.ro> [fisier.svg] [--level M|Q]');
  process.exit(1);
}
if (!['M', 'Q'].includes(level)) {
  console.error('Nivel de corecție acceptat: M sau Q');
  process.exit(1);
}

const svg = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: level, // M = ~15%, Q = ~25% (mai robust la tipărire/logo)
  margin: 4, // quiet zone: 4 module (standard)
  color: { dark: '#0E0D0A', light: '#FFFFFF' },
});
await writeFile(out, svg);
console.log(`QR (${level}) pentru ${url} → ${out}`);
