/**
 * Animațiile cinematice (GSAP). Încărcat dinamic din main.ts.
 * Reguli: doar transform/opacity (+ un singur clip-path scrubbed activ odată
 * și stroke-dashoffset pentru firele aurii mici), pin-uri prin position: sticky,
 * gsap.matchMedia pentru desktop / mobil / mișcare redusă.
 *
 * Stabilitate pe iOS:
 *  - ignoreMobileResize: bara de adresă (resize doar pe înălțime) NU declanșează refresh;
 *    timeline-urile se reconstruiesc doar când se schimbă lățimea / orientarea (matchMedia).
 *  - niciun ScrollTrigger.refresh() forțat în timpul scroll-ului (vezi safeRefresh).
 *  - scroll anchoring dezactivat sub .motion-ok (global.css): în WebKit, SVG-ul înalt al
 *    firului din „Povestea noastră" devenea ancoră și, la fiecare scrub, browserul
 *    „corecta" scroll-ul cu ~1000px înapoi, la începutul poveștii.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });
if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap, __ST: ScrollTrigger });

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const html = document.documentElement;

const Q = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
};

/**
 * Netezire pentru scrub (secunde de „ajungere din urmă").
 * Desktop: Lenis netezește deja scroll-ul, deci doar puțin în plus.
 * Mobil: scroll nativ (evenimente discrete, asincrone pe iOS) → netezire mai mare.
 */
let SCRUB = 0.5;
let SCRUB_SOFT = 0.8;

type Inset = { t: number; r: number; b: number; l: number };
const insetStr = (i: Inset, radius: number) =>
  `inset(${i.t}% ${i.r}% ${i.b}% ${i.l}% round ${radius}px ${radius}px 0px 0px)`;
const FULL = 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)';

/** Refresh doar când utilizatorul nu derulează (altfel ScrollTrigger mută scroll-ul la 0 și înapoi). */
function safeRefresh() {
  if (!ScrollTrigger.isScrolling()) {
    ScrollTrigger.refresh();
    return;
  }
  const once = () => {
    ScrollTrigger.removeEventListener('scrollEnd', once);
    ScrollTrigger.refresh();
  };
  ScrollTrigger.addEventListener('scrollEnd', once);
}

/** Așteaptă decodarea unei imagini (fără să blocheze mai mult de `ms`). */
const decoded = (img: HTMLImageElement | null, ms = 1200) =>
  img?.decode
    ? Promise.race([img.decode().catch(() => undefined), new Promise((r) => setTimeout(r, ms))])
    : Promise.resolve();

/** Animații de intrare (o singură dată, la load). */
async function heroIntro() {
  const visual = $('.hero__visual');
  const img = $<HTMLImageElement>('[data-hero-img]');
  if (!visual) return;
  // Fontul titlului (preîncărcat) + poza decodată, ca intro-ul să nu sacadeze – maxim ~1 s.
  await Promise.all([Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 800))]), decoded(img, 1000)]);
  const names = $$('[data-split]', visual);
  const split = SplitText.create(names, { type: 'chars,lines', mask: 'lines', aria: 'none', linesClass: 'hl' });
  visual.classList.add('is-ready');

  // După intro, SplitText se anulează: titlul redevine text simplu (fără zeci de span-uri cu măști),
  // deci se rasterizează o singură dată când e scalat spre header.
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => split.revert() });
  if (img) tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 2.8, ease: 'power3.out', clearProps: 'transform' }, 0);
  tl.from(split.chars, { yPercent: 118, duration: 1.6, stagger: 0.045 }, 0.15)
    .from('[data-hero-amp]', { opacity: 0, scale: 0.6, rotate: -10, duration: 1.7 }, 0.5)
    .from('[data-hero-fade]', { opacity: 0, y: 18, duration: 1.3, stagger: 0.12 }, 0.65);
}

/** Hero: imaginea full-bleed se strânge într-o fereastră arcuită; numele urcă în header. */
function heroScroll(desktop: boolean) {
  const hero = $('[data-hero]');
  const frame = $('[data-hero-frame]');
  const media = $('[data-hero-media]');
  const title = $('[data-hero-title]');
  const logo = $('[data-logo]');
  const header = $('[data-header]');
  if (!hero || !frame || !media || !title || !logo || !header) return;
  // Logo-ul și fundalul header-ului sunt conduse de scroll (nu de tranziții CSS pe timp).
  header.classList.add('is-linked');

  const win: Inset = desktop ? { t: 13, r: 35, b: 11, l: 35 } : { t: 16, r: 12, b: 16, l: 12 };
  // Lățimea se citește doar la refresh (nu la fiecare frame).
  let vw = innerWidth;
  const radius = () => (vw * (100 - win.l - win.r)) / 200;

  // Delta titlu → logo (fără transformările curente). Măsurat doar la refresh.
  let delta = { x: 0, y: 0, s: 1 };
  const measure = () => {
    vw = innerWidth;
    const prev = title.style.transform;
    const prevLogo = logo.style.transform;
    title.style.transform = 'none';
    logo.style.transform = 'none';
    const a = title.getBoundingClientRect();
    const b = logo.getBoundingClientRect();
    title.style.transform = prev;
    logo.style.transform = prevLogo;
    const s = desktop ? b.width / a.width : Math.min(b.width / a.width, (b.height / a.height) * 2.2);
    delta = {
      x: b.left + b.width / 2 - (a.left + a.width / 2),
      y: b.top + b.height / 2 - (a.top + a.height / 2),
      s,
    };
  };
  measure();

  let wasDone = false;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: SCRUB,
      invalidateOnRefresh: true,
      onRefreshInit: measure,
      onUpdate(self) {
        const done = self.progress > 0.6;
        if (done !== wasDone) {
          wasDone = done;
          window.dispatchEvent(new CustomEvent('dd:hero', { detail: done }));
        }
      },
    },
  });

  // Predare titlu → logo: titlul ajunge la poziția logo-ului la ~0.58; în aceeași fereastră
  // (0.48–0.6) titlul se stinge și logo-ul se aprinde pe loc → fără gol și fără „pas".
  tl.fromTo(frame, { clipPath: FULL }, { clipPath: () => insetStr(win, radius()), ease: 'power2.inOut', duration: 0.7 }, 0)
    .fromTo(
      media,
      { scale: 1, x: 0 },
      {
        scale: desktop ? 1.14 : 1.04,
        x: () => (desktop ? vw * 0.16 : 0),
        ease: 'power2.inOut',
        duration: 0.7,
        force3D: true,
      },
      0,
    )
    .to('[data-hero-shade]', { opacity: 0.2, duration: 0.5, ease: 'sine.inOut' }, 0)
    .to('[data-hero-fade]', { opacity: 0, y: -24, duration: 0.2, stagger: 0.03, ease: 'power1.in' }, 0)
    .to(
      title,
      { x: () => delta.x, y: () => delta.y, scale: () => delta.s, ease: 'power2.inOut', duration: 0.52, force3D: true },
      0.06,
    )
    .fromTo(header, { '--hdr-bg': 0 }, { '--hdr-bg': 1, duration: 0.16, ease: 'sine.inOut' }, 0.44)
    .to(title, { opacity: 0, duration: 0.12, ease: 'sine.inOut' }, 0.48)
    .fromTo(logo, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.12, ease: 'sine.inOut', force3D: true }, 0.48)
    .fromTo('[data-hero-ring]', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out' }, 0.52)
    .fromTo('[data-hero-caption]', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }, 0.6)
    .to({}, { duration: 0.18 });

  return () => {
    header.classList.remove('is-linked');
    gsap.set([logo, header], { clearProps: 'opacity,transform,--hdr-bg' });
  };
}

/** Invitația: night → ivory (crossfade de strat), apoi textul se luminează cuvânt cu cuvânt. */
function invitation() {
  const sec = $('[data-invite]');
  const veil = $('[data-invite-veil]');
  const text = $('[data-words]');
  if (!sec || !veil || !text) return;
  gsap.fromTo(
    veil,
    { opacity: 1 },
    { opacity: 0, ease: 'sine.inOut', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 20%', scrub: SCRUB } },
  );
  const split = SplitText.create(text, { type: 'words', aria: 'auto' });
  gsap.fromTo(
    split.words,
    { opacity: 0.14 },
    {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 48%', scrub: SCRUB_SOFT },
    },
  );
}

/**
 * Desenează un fir SVG (pathLength="1") la scroll. CAUZA „snappy": GSAP rotunjește strokeDashoffset
 * (unitless 1→0) la întreg, deci firul sărea de la 1 la 0 la jumătatea scroll-ului. Animăm un proxy
 * numeric și scriem stilul direct; fade-in în primele ~12% ca capătul rotunjit al unui dash ~0 să nu
 * apară ca un punct. Se adaugă într-un timeline: `.add(drawTween(p, durată), poziție)`.
 */
function drawTween(p: SVGPathElement, duration: number) {
  const draw = { v: 1 };
  p.style.strokeDasharray = '1';
  p.style.strokeDashoffset = '1';
  return gsap
    .timeline({ defaults: { ease: 'none' } })
    .to(draw, { v: 0, duration, onUpdate: () => (p.style.strokeDashoffset = draw.v.toFixed(4)) }, 0)
    .fromTo(p, { opacity: 0 }, { opacity: 1, duration: duration * 0.12, ease: 'sine.out' }, 0);
}

/** Firele aurii mici (segmentele dintre secțiuni) se desenează la scroll. */
function threads() {
  $$<SVGPathElement>('[data-draw]').forEach((p) => {
    const svg = p.ownerSVGElement ?? p;
    // Interval generos (de la intrarea în viewport până spre centru).
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: svg, start: 'top 92%', end: 'bottom 40%', scrub: SCRUB_SOFT },
      })
      .add(drawTween(p, 1), 0);
  });
}

/** Povestea: desktop = timeline orizontal (sticky + translateX); mobil = vertical. */
function story(desktop: boolean) {
  const sec = $('[data-story]');
  const veil = $('[data-story-veil]');
  if (!sec) return;
  if (veil) {
    gsap.fromTo(
      veil,
      { opacity: 1 },
      { opacity: 0, ease: 'sine.inOut', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 25%', scrub: SCRUB } },
    );
  }

  if (desktop) {
    const pin = $('[data-story-pin]');
    const track = $('[data-story-track]');
    const hpath = $<SVGPathElement>('[data-hthread]');
    if (!pin || !track) return;
    // Dimensiuni citite doar la refresh (refreshInit), niciodată în timpul scroll-ului.
    let dist = 0;
    const setH = () => {
      dist = Math.max(0, track.scrollWidth - innerWidth);
      pin.style.setProperty('--story-h', `${dist + innerHeight}px`);
    };
    setH();
    ScrollTrigger.addEventListener('refreshInit', setH);

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: SCRUB, invalidateOnRefresh: true },
    });
    tl.to(track, { x: () => -dist, force3D: true }, 0);
    if (hpath) tl.add(drawTween(hpath, 0.5), 0); // 0.5 = durata implicită a tween-ului track
    const move = tl;

    $$('[data-moment]').forEach((m) => {
      const par = $('[data-par]', m);
      if (par) {
        gsap.fromTo(
          par,
          { xPercent: -7 },
          {
            xPercent: 7,
            ease: 'none',
            scrollTrigger: { trigger: m, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
          },
        );
      }
      ScrollTrigger.create({
        trigger: m,
        containerAnimation: move,
        start: 'left 75%',
        onEnter: () => m.classList.add('is-on'),
      });
    });
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', setH);
      pin.style.removeProperty('--story-h');
    };
  }

  // mobil: firul vertical e un <span> scalat pe Y (compozitat), nu un SVG înalt cu dash.
  const list = $('.story__list');
  const vfill = $('[data-vline]');
  if (list && vfill) {
    gsap.fromTo(
      vfill,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 60%', scrub: SCRUB_SOFT },
      },
    );
  }
  $$('[data-par]').forEach((par) => {
    gsap.fromTo(
      par,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: par.parentElement, start: 'top bottom', end: 'bottom top', scrub: SCRUB_SOFT },
      },
    );
  });
}

/** Panoramicul „Am spus DA" se deschide de la centru spre margini. */
function pano() {
  const fig = $('[data-pano]');
  const clip = $('[data-pano-clip]');
  const media = $('[data-pano-media]');
  if (!fig || !clip || !media) return;
  gsap
    .timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: fig, start: 'top 85%', end: 'top 20%', scrub: SCRUB } })
    .fromTo(clip, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
    .fromTo(media, { scale: 1.3 }, { scale: 1, force3D: true }, 0);
}

/** Parallax pentru benzi foto și RSVP. */
function parallax(desktop: boolean) {
  const band = $('[data-band]');
  const bandMedia = $('[data-band-media]');
  if (band && bandMedia) {
    gsap.fromTo(
      bandMedia,
      { yPercent: -9 },
      {
        yPercent: 9,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: SCRUB_SOFT },
      },
    );
  }
  const rsvp = $('[data-rsvp]');
  const rsvpMedia = $('[data-rsvp-media]');
  const panel = $('[data-rsvp-panel]');
  if (rsvp && rsvpMedia && desktop) {
    gsap.fromTo(
      rsvpMedia,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: rsvp, start: 'top bottom', end: 'bottom top', scrub: SCRUB_SOFT },
      },
    );
  }
  if (panel) {
    gsap.fromTo(
      panel,
      { y: desktop ? 160 : 90 },
      {
        y: 0,
        ease: 'power1.out',
        scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top 45%', scrub: SCRUB_SOFT },
      },
    );
  }
  if (desktop) {
    const grid = $('[data-gal-track]');
    const cols = $$('.gal__col');
    if (grid && cols.length) {
      // O singură ScrollTrigger pentru toate coloanele (mai puțin lucru per frame).
      const tl = gsap.timeline({
        defaults: { ease: 'none', force3D: true },
        scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: SCRUB_SOFT },
      });
      cols.forEach((col) => {
        const sp = Number(col.dataset.speed ?? 0);
        tl.fromTo(col, { y: -sp * 9 }, { y: sp * 9 }, 0);
      });
    }
  }
}

/** Finalul oglindește hero-ul: fereastra arcuită se deschide spre full-bleed; firul închide monograma. */
function finale(desktop: boolean) {
  const sec = $('[data-finale]');
  const frame = $('[data-fin-frame]');
  const media = $('[data-fin-media]');
  const ring = $<SVGPathElement>('[data-fin-ring]');
  if (!sec || !frame || !media) return;
  const win: Inset = desktop ? { t: 14, r: 36, b: 12, l: 36 } : { t: 18, r: 16, b: 18, l: 16 };
  let vw = innerWidth;
  const radius = () => (vw * (100 - win.l - win.r)) / 200;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: sec,
      start: 'top 35%',
      end: 'bottom bottom',
      scrub: SCRUB,
      invalidateOnRefresh: true,
      onRefreshInit: () => (vw = innerWidth),
    },
  });
  tl.fromTo(frame, { clipPath: () => insetStr(win, radius()) }, { clipPath: FULL, ease: 'power2.inOut', duration: 0.6 }, 0)
    .fromTo(
      media,
      { scale: 1.18, x: () => (desktop ? vw * 0.16 : 0) },
      { scale: 1, x: 0, ease: 'power2.inOut', duration: 0.6, force3D: true },
      0,
    )
    .from('.fin__letters', { opacity: 0, scale: 0.85, duration: 0.28, ease: 'power2.out' }, 0.38)
    .from('[data-fin-text]', { opacity: 0, y: 30, stagger: 0.08, duration: 0.28, ease: 'power2.out' }, 0.48);
  if (ring) tl.add(drawTween(ring, 0.45), 0.33);
  tl.to({}, { duration: 0.15 });
}

/** Lenis: doar desktop cu mouse; pe touch rămâne scroll-ul nativ. */
async function smoothScroll() {
  if (!matchMedia('(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
  const { default: Lenis } = await import('lenis');
  // autoRaf: false → Lenis e condus de ticker-ul GSAP (un singur rAF pentru tot).
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, syncTouch: false, autoRaf: false, anchors: { offset: -72 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener('dd:lock', (e) => ((e as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start()));
}

export function initMotion() {
  heroIntro();

  const mm = gsap.matchMedia();
  mm.add(Q, (ctx) => {
    const { desktop, reduced } = ctx.conditions as Record<keyof typeof Q, boolean>;
    if (reduced) {
      // Fără pin/scrub/parallax: layout static + fade-uri CSS scurte.
      html.classList.remove('motion-ok');
      window.dispatchEvent(new CustomEvent('dd:hero', { detail: false }));
      return () => html.classList.add('motion-ok');
    }
    SCRUB = desktop ? 0.5 : 0.6;
    SCRUB_SOFT = desktop ? 0.7 : 0.9;
    const cleanupHero = heroScroll(desktop);
    invitation();
    threads();
    const cleanupStory = story(desktop);
    pano();
    parallax(desktop);
    finale(desktop);
    return () => {
      cleanupHero?.();
      cleanupStory?.();
    };
  });

  smoothScroll();
  // Fonturile pot schimba măsurătorile (titlul din hero). ScrollTrigger face singur refresh la
  // „load" (amânat dacă se derulează); noi nu mai forțăm refresh-uri în timpul scroll-ului.
  document.fonts?.ready.then(safeRefresh);
}
