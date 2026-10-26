/**
 * Animațiile cinematice (GSAP). Încărcat dinamic din main.ts.
 * Reguli: doar transform/opacity (+ un singur clip-path scrubbed activ odată
 * și stroke-dashoffset pentru firul auriu), pin-uri prin position: sticky,
 * gsap.matchMedia pentru desktop / mobil / mișcare redusă.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const html = document.documentElement;

const Q = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
};

type Inset = { t: number; r: number; b: number; l: number };
const insetStr = (i: Inset, radius: number) =>
  `inset(${i.t}% ${i.r}% ${i.b}% ${i.l}% round ${radius}px ${radius}px 0px 0px)`;
const FULL = 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)';

/** Animații de intrare (o singură dată, la load). */
async function heroIntro() {
  const visual = $('.hero__visual');
  const img = $('[data-hero-img]');
  if (!visual) return;
  // Așteptăm fontul titlului (preîncărcat) – maxim 800 ms.
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 800))]);
  const names = $$('[data-split]', visual);
  const split = SplitText.create(names, { type: 'chars,lines', mask: 'lines', aria: 'none', linesClass: 'hl' });
  visual.classList.add('is-ready');

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (img) tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 2.6, ease: 'power2.out', clearProps: 'transform' }, 0);
  tl.from(split.chars, { yPercent: 118, duration: 1.5, stagger: 0.05 }, 0.15)
    .from('[data-hero-amp]', { opacity: 0, scale: 0.6, rotate: -10, duration: 1.6 }, 0.5)
    .from('[data-hero-fade]', { opacity: 0, y: 18, duration: 1.2, stagger: 0.12 }, 0.65);
}

/** Hero: imaginea full-bleed se strânge într-o fereastră arcuită; numele urcă în header. */
function heroScroll(desktop: boolean) {
  const hero = $('[data-hero]');
  const frame = $('[data-hero-frame]');
  const media = $('[data-hero-media]');
  const title = $('[data-hero-title]');
  const logo = $('[data-logo]');
  if (!hero || !frame || !media || !title || !logo) return;

  const win: Inset = desktop ? { t: 13, r: 35, b: 11, l: 35 } : { t: 16, r: 12, b: 16, l: 12 };
  const radius = () => (innerWidth * (100 - win.l - win.r)) / 200;

  // Delta titlu → logo (fără transformările curente).
  let delta = { x: 0, y: 0, s: 1 };
  const measure = () => {
    const prev = title.style.transform;
    title.style.transform = 'none';
    const a = title.getBoundingClientRect();
    title.style.transform = prev;
    const b = logo.getBoundingClientRect();
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
      scrub: desktop ? true : 0.3,
      invalidateOnRefresh: true,
      onRefreshInit: measure,
      onUpdate(self) {
        const done = self.progress > 0.62;
        if (done !== wasDone) {
          wasDone = done;
          window.dispatchEvent(new CustomEvent('dd:hero', { detail: done }));
        }
      },
    },
  });

  tl.fromTo(frame, { clipPath: FULL }, { clipPath: () => insetStr(win, radius()), ease: 'power2.inOut', duration: 0.7 }, 0)
    .fromTo(
      media,
      { scale: 1, x: 0 },
      { scale: desktop ? 1.14 : 1.04, x: () => (desktop ? innerWidth * 0.16 : 0), ease: 'power2.inOut', duration: 0.7 },
      0,
    )
    .to('[data-hero-shade]', { opacity: 0.2, duration: 0.5 }, 0)
    .to('[data-hero-fade]', { opacity: 0, y: -24, duration: 0.18, stagger: 0.03 }, 0)
    .to(title, { x: () => delta.x, y: () => delta.y, scale: () => delta.s, ease: 'power2.inOut', duration: 0.55 }, 0.06)
    .to(title, { opacity: 0, duration: 0.08 }, desktop ? 0.56 : 0.46)
    .fromTo('[data-hero-ring]', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.25 }, 0.55)
    .fromTo('[data-hero-caption]', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.2 }, 0.62)
    .to({}, { duration: 0.18 });
}

/** Invitația: night → ivory, apoi textul se luminează cuvânt cu cuvânt. */
function invitation() {
  const sec = $('[data-invite]');
  const veil = $('[data-invite-veil]');
  const text = $('[data-words]');
  if (!sec || !veil || !text) return;
  gsap.fromTo(
    veil,
    { opacity: 1 },
    { opacity: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 20%', scrub: true } },
  );
  const split = SplitText.create(text, { type: 'words', aria: 'auto' });
  gsap.fromTo(
    split.words,
    { opacity: 0.14 },
    {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 48%', scrub: true },
    },
  );
}

/** Firul auriu: segmentele se desenează la scroll. */
function threads() {
  $$<SVGPathElement>('[data-draw]').forEach((p) => {
    const svg = p.ownerSVGElement ?? p;
    gsap.fromTo(
      p,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: svg, start: 'top 88%', end: 'bottom 55%', scrub: true },
      },
    );
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
      { opacity: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 25%', scrub: true } },
    );
  }

  if (desktop) {
    const pin = $('[data-story-pin]');
    const track = $('[data-story-track]');
    const hpath = $<SVGPathElement>('[data-hthread]');
    if (!pin || !track) return;
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const setH = () => pin.style.setProperty('--story-h', `${dist() + innerHeight}px`);
    setH();
    ScrollTrigger.addEventListener('refreshInit', setH);

    const move = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
    });
    if (hpath) {
      gsap.fromTo(
        hpath,
        { strokeDasharray: 1, strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: true },
        },
      );
    }
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

  // mobil
  const vpath = $<SVGPathElement>('[data-vthread]');
  if (vpath) {
    gsap.fromTo(
      vpath,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: vpath.ownerSVGElement, start: 'top 60%', end: 'bottom 60%', scrub: true },
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
        scrollTrigger: { trigger: par.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
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
  const st = { trigger: fig, start: 'top 85%', end: 'top 20%', scrub: true };
  gsap.fromTo(clip, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power1.out', scrollTrigger: st });
  gsap.fromTo(media, { scale: 1.3 }, { scale: 1, ease: 'power1.out', scrollTrigger: { ...st } });
}

/** Parallax pentru benzi foto și RSVP. */
function parallax(desktop: boolean) {
  const band = $('[data-band]');
  const bandMedia = $('[data-band-media]');
  if (band && bandMedia) {
    gsap.fromTo(
      bandMedia,
      { yPercent: -9 },
      { yPercent: 9, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  }
  const rsvp = $('[data-rsvp]');
  const rsvpMedia = $('[data-rsvp-media]');
  const panel = $('[data-rsvp-panel]');
  if (rsvp && rsvpMedia && desktop) {
    gsap.fromTo(
      rsvpMedia,
      { yPercent: -6 },
      { yPercent: 6, ease: 'none', scrollTrigger: { trigger: rsvp, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  }
  if (panel) {
    gsap.fromTo(
      panel,
      { y: desktop ? 160 : 90 },
      { y: 0, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top 45%', scrub: true } },
    );
  }
  if (desktop) {
    const grid = $('[data-gal-track]');
    $$('.gal__col').forEach((col) => {
      const sp = Number(col.dataset.speed ?? 0);
      gsap.fromTo(
        col,
        { y: -sp * 9 },
        { y: sp * 9, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    });
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
  const radius = () => (innerWidth * (100 - win.l - win.r)) / 200;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: sec,
      start: 'top 35%',
      end: 'bottom bottom',
      scrub: desktop ? true : 0.3,
      invalidateOnRefresh: true,
    },
  });
  tl.fromTo(frame, { clipPath: () => insetStr(win, radius()) }, { clipPath: FULL, ease: 'power2.inOut', duration: 0.6 }, 0)
    .fromTo(
      media,
      { scale: 1.18, x: () => (desktop ? innerWidth * 0.16 : 0) },
      { scale: 1, x: 0, ease: 'power2.inOut', duration: 0.6 },
      0,
    )
    .from('.fin__letters', { opacity: 0, scale: 0.85, duration: 0.25 }, 0.4)
    .from('[data-fin-text]', { opacity: 0, y: 30, stagger: 0.08, duration: 0.25 }, 0.5);
  if (ring) tl.fromTo(ring, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45 }, 0.35);
  tl.to({}, { duration: 0.15 });
}

/** Lenis: doar desktop cu mouse; pe touch rămâne scroll-ul nativ. */
async function smoothScroll() {
  if (!matchMedia('(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
  const { default: Lenis } = await import('lenis');
  const lenis = new Lenis({ lerp: 0.11, syncTouch: false, anchors: { offset: -72 } });
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
    heroScroll(desktop);
    invitation();
    threads();
    const cleanupStory = story(desktop);
    pano();
    parallax(desktop);
    finale(desktop);
    return () => cleanupStory?.();
  });

  smoothScroll();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
