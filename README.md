# Diana & Dragoș – invitație de nuntă

Site static (Astro + TypeScript + GSAP + Lenis), doar front-end, optimizat pentru telefon (QR) și desktop.

## Rulare

```bash
npm install
npm run dev       # http://localhost:4321 – dezvoltare
npm run build     # generează site-ul în dist/
npm run preview   # servește local versiunea din dist/
```

Necesită Node.js 20+.

## Unde editezi conținutul

**Tot textul e în `src/data/wedding.ts`**: data și ora, părinții și nașii, povestea, locațiile (cu coordonate),
programul, dress code-ul, RSVP (inclusiv numărul de WhatsApp), info utile.
Caută `TODO` în fișier: acolo sunt valorile de înlocuit. Momentan conținutul e placeholder.

- Data: `date.start` / `date.end` sunt în format ISO cu fusul orar al României (`+03:00` vara, `+02:00` iarna).
  Countdown-ul, linkul Google Calendar și fișierul `.ics` (generat automat la build) se iau de aici.
  Actualizează și textele `date.long`, `date.short` etc.
- Domeniul final: în `astro.config.mjs` (`SITE`), folosit pentru og:image și link-uri absolute.
  Pe Netlify se ia automat din variabila `URL`.

## Pozele

Pozele folosite sunt în `src/assets/photos/` (`arcada.jpg`, `portret.jpg`, `inel.jpg`, `intim.jpg`, `apus.jpg`, `civila.jpg`).
Originalele rămân neatinse în `poze_proiect_cuplu/`.

Ca să înlocuiești o poză:
1. Suprascrie fișierul cu **același nume** în `src/assets/photos/`.
2. Rulează `npm run images`. Asta regenerează crop-urile pentru mobil (`src/assets/photos/crops/`),
   imaginea de preview `public/og-image.jpg` (1200×630) și placeholder-ele blur (`src/data/lqip.json`).
   Dacă subiectul e în altă poziție, ajustează `cx` în `scripts/prepare-images.mjs`.
3. Textele alternative (alt) sunt în `src/data/photos.ts`.

La build, Astro generează automat AVIF, WebP și JPEG în mai multe dimensiuni.

## Fonturile

Sunt self-hosted în `public/fonts/` (Cormorant Garamond, Manrope, Pinyon Script), reduse la latin + diacriticele românești.
Le regenerezi din pachetele `@fontsource` cu `npm run fonts`.

## Deploy pe Netlify

1. Urcă proiectul pe GitHub (sau GitLab sau Bitbucket).
2. În Netlify: *Add new site → Import an existing project*, alegi repo-ul.
   Setările se citesc din `netlify.toml` (build `npm run build`, publish `dist`).
3. **Formularul RSVP** e detectat automat (Netlify Forms, `data-netlify="true"` și `public/__forms.html`).
   Răspunsurile apar în Netlify → *Forms → rsvp*. Poți activa notificări pe email din *Forms → Settings*.
   Local (`localhost`) trimiterea e doar simulată.
4. Opțional: domeniu propriu din *Domain management*.

Alternativ, fără Git: `npm run build`, apoi trage folderul `dist/` în pagina *Deploys* din Netlify (Forms funcționează și așa).

## Codul QR

```bash
npm run qr -- https://domeniul-vostru.ro                 # → qr-invitatie.svg (corecție Q)
npm run qr -- https://domeniul-vostru.ro qr.svg --level M
```

SVG-ul are quiet zone de 4 module (standard), deci e bun pentru tipar la orice dimensiune.
Testează-l cu 2–3 telefoane înainte de tipărire. Recomandat: minimum 2,5 cm latură.

## Structura

```
src/
  data/wedding.ts        tot conținutul (TODO-uri)
  data/photos.ts         importul pozelor + alt text
  components/            secțiunile (Hero, Invitation, Countdown, Story, Details, Schedule,
                         DressCode, Gallery, Rsvp, Info, Finale, Header, Footer) + ui/
  scripts/main.ts        JS ușor: reveal, header, countdown, formular, galerie/lightbox
  scripts/motion.ts      animațiile GSAP (încărcate dinamic) + Lenis (doar desktop)
  styles/global.css      paleta (CSS custom properties), fonturi, butoane
  pages/                 index, multumim (fallback formular fără JS), .ics
public/                  fonturi, favicon, og-image, __forms.html
scripts/                 prepare-images, build-fonts, qr
```

Accesibilitate: dacă vizitatorul are activată opțiunea „reduce motion", site-ul nu folosește pin, scrub sau parallax,
doar fade-uri scurte. Fără JavaScript, tot conținutul rămâne vizibil.
