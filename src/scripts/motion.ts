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
  // Telefon/tabletă în landscape: fereastra arcuită ar fi prea lată și prea joasă (poza nu încape),
  // deci hero-ul și finalul rămân full-bleed. Cheia separată face ca rotirea să reconstruiască animațiile.
  landscape: '(max-width: 1023px) and (orientation: landscape) and (prefers-reduced-motion: no-preference)',
};

/**
 * Efectele aurii – „butoane de volum". Pune 0 / false ca să oprești un efect.
 * (Intensitatea vizuală a scânteii/luciului: --spark-size, --spark-glow, --sheen în global.css.)
 */
const FX = {
  /** Scânteia care conduce firele aurii (capătul luminos care se mișcă odată cu progresul). */
  spark: true,
  /**
   * Cât de mult se aprinde halo-ul scânteii la scroll rapid (0 = static, 1 = normal).
   * 0 = aspectul de până acum: în versiunea anterioară efectul NU se vedea deloc (quickTo pe „scale"
   * nu e suportat de GSAP → avertisment în consolă la fiecare frame + tween re-inițializat, halo-ul
   * rămânea la scale 1). Acum mecanismul funcționează; pune 1 dacă vrei să-l activezi.
   */
  sparkSpeedGlow: 0,
  /** Luciul care curge pe partea umplută a firelor verticale (poveste pe mobil, program). */
  lineSheen: true,
  /** Sclipirea care trece peste sigiliul de ceară cât plicul e închis. */
  sealGlint: true,
  /** Praf auriu: la ruperea sigiliului (legat de scroll) și în final (ambient, doar cât e în ecran). */
  heroDust: { desktop: 14, mobile: 9 },
  finaleDust: { desktop: 16, mobile: 9 },
};

/** Elemente/ascultători creați de noi într-un context matchMedia (eliminați la revert). */
let made: Element[] = [];
let offs: (() => void)[] = [];
const onRefresh = (fn: () => void) => {
  ScrollTrigger.addEventListener('refresh', fn);
  offs.push(() => ScrollTrigger.removeEventListener('refresh', fn));
};

/**
 * Animațiile CSS infinite (indiciile „derulează") se opresc cât elementul e în afara ecranului (.is-off).
 * Altfel continuau la nesfârșit și forțau un recalcul de stil la fiecare frame, pe toată pagina
 * (inclusiv în repaus). Clasa marchează starea „oprit", deci până se încarcă GSAP nimic nu se schimbă.
 */
function pauseOffscreen(trigger: Element | null, target: Element | null = trigger) {
  if (!trigger || !target) return;
  const set = (self: ScrollTrigger) => target.classList.toggle('is-off', !self.isActive);
  ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: set, onRefresh: set });
  offs.push(() => target.classList.remove('is-off'));
}

/** PRNG determinist (aceleași particule la fiecare încărcare, fără „salturi" între build-uri). */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Spark = (x: number, y: number, t: number) => void;

/**
 * Scânteia din capătul unui fir: miez luminos + halo (radial-gradient, fără filter).
 * Se aprinde la început, se stinge când firul e complet; opțional (FX.sparkSpeedGlow) halo-ul crește cu viteza.
 * Totul prin transform/opacity (quickSetter → un singur write de stil per frame).
 */
function makeSpark(host: HTMLElement, tail = false): Spark | undefined {
  if (!FX.spark) return;
  const el = document.createElement('span');
  el.className = 'spark';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `${tail ? '<span class="spark__tail"></span>' : ''}<span class="spark__halo"></span><span class="spark__core"></span>`;
  host.appendChild(el);
  made.push(el);
  const halo = el.querySelector('.spark__halo')!;
  gsap.set(el, { x: 0, y: 0, force3D: true });
  const setX = gsap.quickSetter(el, 'x', 'px');
  const setY = gsap.quickSetter(el, 'y', 'px');
  const setO = gsap.quickSetter(el, 'opacity');
  // quickTo acceptă doar proprietăți simple: „scale" (= scaleX + scaleY) nu poate fi resetat.
  const qx = FX.sparkSpeedGlow ? gsap.quickTo(halo, 'scaleX', { duration: 0.5, ease: 'power3.out' }) : null;
  const qy = FX.sparkSpeedGlow ? gsap.quickTo(halo, 'scaleY', { duration: 0.5, ease: 'power3.out' }) : null;
  const glow = (v: number) => {
    qx?.(v);
    qy?.(v);
  };
  const settle = FX.sparkSpeedGlow ? gsap.delayedCall(0.12, () => glow(1)).pause() : null;
  let lastT = 0;
  let lastAt = 0;
  return (x, y, t) => {
    setX(x);
    setY(y);
    setO(smooth(0, 0.035, t) * (1 - smooth(0.93, 0.995, t)));
    if (!settle) return;
    const now = performance.now();
    const dt = Math.max(16, now - lastAt);
    const speed = Math.abs(t - lastT) / dt; // progres / ms
    lastT = t;
    lastAt = now;
    glow(1 + Math.min(0.6, speed * 900) * FX.sparkSpeedGlow);
    settle.restart(true);
  };
}

/**
 * Desenarea unui fir SVG (pathLength="1") + scânteia din capăt.
 *
 * DE CE nu mai e „1 → 0" simplu: firele au vector-effect: non-scaling-stroke, iar atât Chrome cât și
 * WebKit aplică atunci dash-ul în pixeli de ecran, cu unitatea = lungimea path-ului în unități SVG
 * (pathLength="1" ⇒ 1 = getTotalLength() px). Pe un SVG întins neuniform (firul orizontal din poveste:
 * viewBox 1000 → ~4500px) dash-ul de „1" acoperea doar ~1000px și se repeta → firul aluneca bucăți-bucăți
 * în loc să se deseneze. Corecție: k = lungimea reală în pixeli / lungimea SVG, dasharray = k,
 * offset = k·(1 − t). Lungimea în pixeli se recalculează doar la refresh, nu în timpul scroll-ului.
 * Scânteia (opțională) stă în `host` și merge exact la capătul desenat.
 */
function pathFx(path: SVGPathElement, host?: HTMLElement | null) {
  const svg = path.ownerSVGElement;
  const sp = svg && host ? makeSpark(host) : undefined;
  const N = 240;
  const total = path.getTotalLength() || 1;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const p = path.getPointAtLength((total * i) / N);
    return [p.x, p.y] as const;
  });
  const px: number[] = new Array(N + 1).fill(0);
  const py: number[] = new Array(N + 1).fill(0);
  const acc: number[] = new Array(N + 1).fill(0);
  let k = 1;
  let last = 0;
  let seg = 0; // ultimul segment găsit (progresul variază puțin între frame-uri)

  const measure = () => {
    if (!svg) return;
    const vb = svg.viewBox.baseVal;
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height || !vb?.width) {
      k = 1; // ascuns (display: none) → comportamentul vechi, re-măsurăm la următorul refresh
    } else {
      let kx = r.width / vb.width;
      let ky = r.height / vb.height;
      let ex = 0;
      let ey = 0;
      if (svg.getAttribute('preserveAspectRatio') !== 'none') {
        // xMidYMid meet (implicit): scară uniformă, conținut centrat
        const s = Math.min(kx, ky);
        ex = (r.width - vb.width * s) / 2;
        ey = (r.height - vb.height * s) / 2;
        kx = ky = s;
      }
      const h = host?.getBoundingClientRect();
      const ox = (h ? r.left - h.left - host!.clientLeft : 0) + ex - vb.x * kx;
      const oy = (h ? r.top - h.top - host!.clientTop : 0) + ey - vb.y * ky;
      for (let i = 0; i <= N; i++) {
        px[i] = ox + pts[i][0] * kx;
        py[i] = oy + pts[i][1] * ky;
        acc[i] = i ? acc[i - 1] + Math.hypot(px[i] - px[i - 1], py[i] - py[i - 1]) : 0;
      }
      k = acc[N] / total || 1;
    }
    path.style.strokeDasharray = k.toFixed(5);
    set(last);
  };

  const set = (t: number) => {
    last = t;
    path.style.strokeDashoffset = (k * (1 - t)).toFixed(5);
    if (!sp) return;
    const L = acc[N];
    if (!L) return sp(0, 0, 0);
    const d = Math.min(L, Math.max(0, t * L));
    while (seg > 0 && acc[seg] > d) seg--;
    while (seg < N - 1 && acc[seg + 1] < d) seg++;
    const span = acc[seg + 1] - acc[seg] || 1;
    const f = (d - acc[seg]) / span;
    sp(px[seg] + (px[seg + 1] - px[seg]) * f, py[seg] + (py[seg + 1] - py[seg]) * f, t);
  };

  measure();
  onRefresh(measure);
  return set;
}

/**
 * Fir vertical (element scalat pe Y): scânteie cu coadă în vârf + luciu care curge pe partea
 * umplută (animație CSS, pornită doar cât firul e în ecran prin clasa .is-live).
 * Întoarce funcția care primește progresul (0..1) și poziția vârfului în px (pentru „aprinderi").
 */
function lineFx(line: HTMLElement, fill: HTMLElement) {
  if (FX.lineSheen) {
    const sheen = document.createElement('span');
    sheen.className = 'line-sheen';
    fill.appendChild(sheen);
    made.push(sheen);
    ScrollTrigger.create({
      trigger: line,
      start: 'top bottom',
      end: 'bottom top',
      toggleClass: { targets: line, className: 'is-live' },
    });
  }
  const sp = makeSpark(line, true);
  let H = 0;
  let W = 0;
  let last = 0;
  const update = (t: number) => {
    last = t;
    sp?.(W / 2, t * H, t);
    return t * H;
  };
  const measure = () => {
    H = line.offsetHeight;
    W = line.offsetWidth;
    update(last);
  };
  measure();
  onRefresh(measure);
  return update;
}

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

/** Animație de intrare (o singură dată, la load): sigiliul se așază pe plic. */
function heroIntro() {
  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .from('[data-env-seal]', { scale: 1.6, opacity: 0, rotate: -18, duration: 1.1, ease: 'back.out(1.6)' }, 0.15)
    .from('[data-hero-fade]', { opacity: 0, y: 14, duration: 1.2 }, 0.7);
}

/**
 * Hero: plicul se deschide la scroll. Sigiliul se rupe, clapa de sus se ridică (3D), apoi clapele
 * laterale și cea de jos ies din ecran și rămâne poza full-bleed. Doar transform/opacity (GPU).
 * Logo-ul din header e vizibil tot timpul, deci nu mai există predare titlu → logo.
 */
function heroScroll(desktop: boolean) {
  const hero = $('[data-hero]');
  const media = $('[data-hero-media]');
  const top = $('[data-env-t]');
  const left = $('[data-env-l]');
  const right = $('[data-env-r]');
  const bottom = $('[data-env-b]');
  const sealL = $('[data-seal-l]');
  const sealR = $('[data-seal-r]');
  const sealShadow = $('[data-seal-shadow]');
  if (!hero || !media || !top || !left || !right || !bottom || !sealL || !sealR || !sealShadow) return;
  const g = { force3D: true };

  let wasDone = false;
  let wasOpen = false;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: SCRUB,
      onUpdate(self) {
        // clapele de jos/laterale au ieșit pe jumătate → plicul „e deschis", apare bara de sus
        const open = self.progress > 0.45;
        if (open !== wasOpen) {
          wasOpen = open;
          window.dispatchEvent(new CustomEvent('dd:env', { detail: open }));
        }
        const done = self.progress > 0.7;
        if (done !== wasDone) {
          wasDone = done;
          window.dispatchEvent(new CustomEvent('dd:hero', { detail: done }));
        }
      },
    },
  });

  tl.to('[data-hero-fade]', { opacity: 0, y: -16, duration: 0.14, stagger: 0.02, ease: 'power1.in', ...g }, 0)
    // sigiliul crapă în două: jumătățile se depărtează, se rotesc și cad ușor
    .to(sealShadow, { opacity: 0, duration: 0.06 }, 0.05)
    .to(sealL, { xPercent: -26, yPercent: 14, rotate: -24, opacity: 0, duration: 0.16, ease: 'power2.in', ...g }, 0.05)
    .to(sealR, { xPercent: 26, yPercent: 20, rotate: 20, opacity: 0, duration: 0.16, ease: 'power2.in', ...g }, 0.05)
    // clapa de sus se ridică spre privitor și iese pe sus
    .fromTo(top, { rotationX: 0 }, { rotationX: 180, duration: 0.3, ease: 'power2.inOut', ...g }, 0.12)
    // celelalte clape ies din ecran
    .fromTo(left, { xPercent: 0 }, { xPercent: -104, duration: 0.36, ease: 'power2.inOut', ...g }, 0.32)
    .fromTo(right, { xPercent: 0 }, { xPercent: 104, duration: 0.36, ease: 'power2.inOut', ...g }, 0.32)
    .fromTo(bottom, { yPercent: 0 }, { yPercent: 104, duration: 0.38, ease: 'power2.inOut', ...g }, 0.34)
    // poza „se apropie" puțin cât se deschide plicul
    .fromTo(media, { scale: 1.12 }, { scale: 1, duration: 0.55, ease: 'power2.out', ...g }, 0.28)
    // cartonul de titlu (ca genericul unui film): numele urcă și se clarifică, apoi data
    .fromTo('.hero__names', { opacity: 0, y: 28, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out', ...g }, 0.56)
    .fromTo('.hero__date', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out', ...g }, 0.66)
    .to({}, { duration: 0.16 });

  pauseOffscreen(hero, $('.hero__scroll', hero));

  const glint = $('[data-seal-glint]');
  if (glint) tl.to(glint, { opacity: 0, duration: 0.04 }, 0.05);
  sealDust(tl, desktop);
}

/** Câteva fire de praf auriu sar din sigiliu când se rupe (legat de scroll → reversibil). */
function sealDust(tl: gsap.core.Timeline, desktop: boolean) {
  const env = $('[data-env]');
  const n = desktop ? FX.heroDust.desktop : FX.heroDust.mobile;
  if (!env || !n) return;
  const wrap = document.createElement('span');
  wrap.className = 'dust-burst';
  env.appendChild(wrap);
  made.push(wrap);
  const r = rng(29);
  const reach = desktop ? 1 : 0.7;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i');
    d.className = 'dust';
    const size = 2 + r() * 3.5;
    d.style.width = d.style.height = `${size.toFixed(1)}px`;
    wrap.appendChild(d);
    // evantai spre stânga/dreapta (unde se rupe sigiliul), puțin în sus, apoi „cad"
    const side = i % 2 ? 1 : -1;
    const ang = (-70 + r() * 120) * (Math.PI / 180);
    const dist = (70 + r() * 150) * reach;
    const dx = side * Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist * 0.8 + 30 * reach;
    const t0 = 0.05 + r() * 0.03;
    tl.fromTo(
      d,
      { x: 0, y: 0, scale: 0.4, rotate: 0 },
      { x: dx, y: dy, scale: 1, rotate: side * 90, duration: 0.24, ease: 'power3.out', force3D: true },
      t0,
    )
      .to(d, { opacity: 0.6 + r() * 0.4, duration: 0.025 }, t0)
      .to(d, { opacity: 0, duration: 0.1 }, t0 + 0.1 + r() * 0.06);
  }
}

/** Sclipire scurtă peste sigiliul de ceară, repetată rar cât plicul e închis. */
function sealGlint() {
  const band = $('[data-seal-glint] i');
  if (!band || !FX.sealGlint) return;
  const tl = gsap
    .timeline({ repeat: -1, repeatDelay: 5.5, delay: 1.5 })
    .fromTo(band, { xPercent: -160 }, { xPercent: 160, duration: 1.15, ease: 'power2.inOut', force3D: true });
  ScrollTrigger.create({
    trigger: '[data-hero]',
    start: 'top top',
    end: 'top+=1 top',
    onLeave: () => tl.pause(),
    onEnterBack: () => tl.resume(),
  });
}

/** Invitația: textul se luminează cuvânt cu cuvânt (vine după poveste; arcul de peste hero e pe .story). */
function invitation() {
  const text = $('[data-words]');
  if (!text) return;
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
function drawTween(p: SVGPathElement, duration: number, sparkHost?: HTMLElement | null) {
  const draw = { v: 1 };
  const fx = pathFx(p, FX.spark ? sparkHost : null);
  fx(0);
  return gsap
    .timeline({ defaults: { ease: 'none' } })
    .to(draw, { v: 0, duration, onUpdate: () => fx(1 - draw.v) }, 0)
    .fromTo(p, { opacity: 0 }, { opacity: 1, duration: duration * 0.12, ease: 'sine.out' }, 0);
}

/** Firele aurii mici (segmentele dintre secțiuni) se desenează la scroll, conduse de o scânteie. */
function threads() {
  $$<SVGPathElement>('[data-draw]').forEach((p) => {
    const svg = p.ownerSVGElement ?? p;
    // Interval generos (de la intrarea în viewport până spre centru).
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: svg, start: 'top 92%', end: 'bottom 40%', scrub: SCRUB_SOFT },
      })
      .add(drawTween(p, 1, svg.parentElement), 0);
  });

  // Linia din „Program": element scalat pe Y (compozitat), nu SVG cu stroke-dash.
  const fill = $('[data-sch-fill]');
  const line = fill?.parentElement;
  const list = fill?.closest('ol');
  if (fill && line && list) {
    const fx = lineFx(line, fill);
    gsap.fromTo(
      fill,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 55%', scrub: SCRUB_SOFT },
        onUpdate() {
          fx(this.progress());
        },
      },
    );
  }
}

/** Povestea: desktop = timeline orizontal (sticky + translateX); mobil = vertical. */
function story(desktop: boolean) {
  const sec = $('[data-story]');
  if (!sec) return;

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
    // 0.5 = durata implicită a tween-ului track; scânteia stă în track, deci se mișcă odată cu el.
    if (hpath) tl.add(drawTween(hpath, 0.5, track), 0);
    const move = tl;
    pauseOffscreen(pin, $('.story__hint', pin));

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
  // Scânteia din vârf „aprinde" fiecare punct al poveștii exact când ajunge la el (și îl stinge la scroll înapoi).
  const list = $('.story__list');
  const vfill = $('[data-vline]');
  const vline = vfill?.parentElement;
  if (list && vfill && vline) {
    const fx = lineFx(vline, vfill);
    const moments = $$('[data-moment]', list);
    const dots = moments.map((m) => $('.moment__dot', m));
    let at: number[] = [];
    const measureDots = () => {
      at = moments.map((m, i) => m.offsetTop + (dots[i]?.offsetTop ?? 0) + 7 - vline.offsetTop);
    };
    measureDots();
    onRefresh(measureDots);
    const lit = moments.map(() => false);
    gsap.fromTo(
      vfill,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 60%', scrub: SCRUB_SOFT },
        onUpdate() {
          const y = fx(this.progress());
          moments.forEach((m, i) => {
            const on = y >= at[i] - 1;
            if (on !== lit[i]) {
              lit[i] = on;
              m.classList.toggle('is-on', on);
            }
          });
        },
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
  // „Ne vedem acolo" urcă mai încet decât poza → adâncime (un singur strat de text).
  const bandText = $('.band__text');
  if (band && bandText) {
    gsap.fromTo(
      bandText,
      { yPercent: 60, opacity: 0.2 },
      {
        yPercent: -60,
        opacity: 1,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom 30%', scrub: SCRUB_SOFT },
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
        force3D: true, // umbra mare a panoului se rasterizează o dată, nu la fiecare frame
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

/**
 * Galeria: pozele urcă în ordinea vizuală, iar fiecare imagine „se așază" (scale 1.15 → 1) în arcada ei.
 * O singură dată (nu scrub), doar transform/opacity. Scale pe <picture>, ca hover-ul de pe <img> să rămână.
 */
function gallery() {
  const grid = $('[data-gal-track]');
  if (!grid) return;
  const items = $$('[data-gal-item]', grid).sort((a, b) => Number(a.dataset.galItem) - Number(b.dataset.galItem));
  if (!items.length) return;
  const pics = items.map((i) => $('.gal__pic', i)).filter(Boolean) as HTMLElement[];
  gsap
    .timeline({ scrollTrigger: { trigger: grid, start: 'top 82%', once: true } })
    .from(items, { opacity: 0, y: 60, duration: 1.2, ease: 'expo.out', stagger: 0.09, force3D: true, clearProps: 'opacity,transform' }, 0)
    .from(pics, { scale: 1.16, duration: 1.8, ease: 'expo.out', stagger: 0.09, force3D: true, clearProps: 'transform' }, 0);
}

/** Praf auriu ambiental în final: câteva puncte care urcă lent; animația CSS rulează doar cât secțiunea e în ecran. */
function finaleDust(sec: HTMLElement, desktop: boolean) {
  const host = $('.fin__sticky', sec);
  const n = desktop ? FX.finaleDust.desktop : FX.finaleDust.mobile;
  if (!host || !n) return;
  const wrap = document.createElement('span');
  wrap.className = 'dust-field';
  wrap.setAttribute('aria-hidden', 'true');
  const r = rng(2905);
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i');
    d.className = 'dust';
    const size = 1.5 + r() * 3;
    d.style.cssText =
      `left:${(4 + r() * 92).toFixed(1)}%;top:${(45 + r() * 55).toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;` +
      `--dx:${((r() - 0.5) * 60).toFixed(0)}px;--o:${(0.35 + r() * 0.5).toFixed(2)};` +
      `animation-duration:${(9 + r() * 8).toFixed(1)}s;animation-delay:-${(r() * 12).toFixed(1)}s`;
    wrap.appendChild(d);
  }
  host.insertBefore(wrap, $('.fin__content', host));
  made.push(wrap);
  ScrollTrigger.create({
    trigger: sec,
    start: 'top bottom',
    end: 'bottom top',
    toggleClass: { targets: wrap, className: 'is-live' },
  });
  return wrap;
}

/** Finalul oglindește hero-ul: fereastra arcuită se deschide spre full-bleed; firul închide monograma. */
function finale(desktop: boolean, landscape = false) {
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
  if (!landscape) {
    tl.fromTo(frame, { clipPath: () => insetStr(win, radius()) }, { clipPath: FULL, ease: 'power2.inOut', duration: 0.6 }, 0);
  }
  tl.fromTo(
      media,
      { scale: 1.18, x: () => (desktop ? vw * 0.16 : 0) },
      { scale: 1, x: 0, ease: 'power2.inOut', duration: 0.6, force3D: true },
      0,
    )
    .fromTo('.fin__letters', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out' }, 0.38)
    .fromTo(
      '[data-fin-text]',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.28, ease: 'power2.out', force3D: true },
      0.48,
    );
  const mono = $('[data-fin-mono]');
  if (ring) tl.add(drawTween(ring, 0.45, mono), 0.33);
  const dust = finaleDust(sec, desktop);
  if (dust) tl.fromTo(dust, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3);
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
    const { desktop, reduced, landscape } = ctx.conditions as Record<keyof typeof Q, boolean>;
    if (reduced) {
      // Fără pin/scrub/parallax: layout static + fade-uri CSS scurte.
      html.classList.remove('motion-ok');
      window.dispatchEvent(new CustomEvent('dd:hero', { detail: false }));
      window.dispatchEvent(new CustomEvent('dd:env', { detail: true }));
      return () => html.classList.add('motion-ok');
    }
    SCRUB = desktop ? 0.5 : 0.6;
    SCRUB_SOFT = desktop ? 0.7 : 0.9;
    heroScroll(desktop);
    sealGlint();
    invitation();
    threads();
    const cleanupStory = story(desktop);
    pano();
    parallax(desktop);
    gallery();
    finale(desktop, landscape);
    return () => {
      cleanupStory?.();
      offs.forEach((off) => off());
      made.forEach((el) => el.remove());
      offs = [];
      made = [];
    };
  });

  smoothScroll();
  // Fonturile pot schimba măsurătorile (titlul din hero). ScrollTrigger face singur refresh la
  // „load" (amânat dacă se derulează); noi nu mai forțăm refresh-uri în timpul scroll-ului.
  document.fonts?.ready.then(safeRefresh);
}
