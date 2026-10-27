import { setRoll } from './roller';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Blochează / deblochează scroll-ul (meniu, lightbox); Lenis ascultă evenimentul. */
export function lockScroll(lock: boolean) {
  document.documentElement.style.overflow = lock ? 'hidden' : '';
  window.dispatchEvent(new CustomEvent('dd:lock', { detail: lock }));
}

/* ── Reveal-uri simple: IntersectionObserver + clasă CSS ─────────────────── */
export function initReveal() {
  const els = $$('[data-reveal]');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => io.observe(el));

  // Punctele din povestea (mobil) se aprind când momentul trece de mijlocul ecranului.
  // Cu animații (.motion-ok), le aprinde scânteia firului (motion.ts), sincron cu scroll-ul.
  const momentsIO = new IntersectionObserver(
    (entries) => {
      if (document.documentElement.classList.contains('motion-ok')) return;
      for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-on');
    },
    { rootMargin: '0px 0px -45% 0px' },
  );
  $$('[data-moment]').forEach((m) => momentsIO.observe(m));
}

/* ── Pozele „lazy" se încarcă și se decodează cu ~1,5 ecrane înainte să apară ──
   (decode() în afara thread-ului principal → fără sacadare când intră în viewport). */
export function initPreload() {
  $$<HTMLImageElement>('img[style*="background-image"]').forEach((img) => {
    const clear = () => img.style.removeProperty('background-image');
    if (img.complete && img.naturalWidth) clear();
    else img.addEventListener('load', clear, { once: true });
  });

  const imgs = $$<HTMLImageElement>('img[loading="lazy"]');
  if (!imgs.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const img = e.target as HTMLImageElement;
        io.unobserve(img);
        img.loading = 'eager';
        img.decode?.().catch(() => {});
      }
    },
    { rootMargin: '150% 0px 150% 0px' },
  );
  imgs.forEach((img) => io.observe(img));
}

/* ── Header: logo după hero, fundal solid, link activ, meniu mobil ─────── */
export function initHeader() {
  const header = $('[data-header]');
  const hero = $('[data-hero]');
  if (!header) return;
  // Cât timp plicul e închis, bara de sus (nume, „Confirmă", meniu) e ascunsă; apare când se deschide.
  // Fără animații (sau dacă GSAP nu pornește) nu există plic, deci bara e vizibilă de la început (vezi CSS).
  let envOpen = false;
  let heroDone = false;
  let pastHero = false;
  const sync = () => {
    header.classList.toggle('is-solid', pastHero || heroDone);
    header.classList.toggle('is-veiled', !(envOpen || pastHero));
  };
  sync();
  window.addEventListener('dd:env', (e) => {
    envOpen = (e as CustomEvent<boolean>).detail;
    sync();
  });
  window.addEventListener('dd:hero', (e) => {
    heroDone = (e as CustomEvent<boolean>).detail;
    sync();
  });
  if (hero) {
    new IntersectionObserver(
      ([e]) => {
        pastHero = !e.isIntersecting;
        sync();
      },
      { rootMargin: '-64px 0px 0px 0px' },
    ).observe(hero);
  }

  // Link activ în meniu
  const links = $$<HTMLAnchorElement>('.hdr__nav a');
  const map = new Map(links.map((a) => [a.hash.slice(1), a]));
  const secIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const a = map.get(e.target.id);
        if (!a) continue;
        if (e.isIntersecting) {
          links.forEach((l) => l.removeAttribute('aria-current'));
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current')) {
          a.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  map.forEach((_, id) => {
    const s = document.getElementById(id);
    if (s) secIO.observe(s);
  });

  // Meniu mobil
  const toggle = $<HTMLButtonElement>('[data-menu-toggle]');
  const menu = $('[data-menu]');
  if (!toggle || !menu) return;
  const label = toggle.querySelector('.sr-only');
  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Închide meniul' : 'Deschide meniul';
    menu.hidden = !open;
    header.classList.toggle('is-open', open);
    lockScroll(open);
    if (open) menu.querySelector<HTMLAnchorElement>('a')?.focus();
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 960px)').addEventListener('change', (e) => e.matches && !menu.hidden && setOpen(false));
}

/* ── Program: elementul activ + ceasul sticky (desktop) ─────────────────── */
export function initSchedule() {
  const clock = $('[data-sch-clock]');
  const items = $$('[data-sch-item]');
  if (!items.length) return;
  if (clock) setRoll(clock, clock.textContent?.trim() ?? '', false);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        items.forEach((i) => i.classList.toggle('is-active', i === e.target));
        const t = (e.target as HTMLElement).dataset.time;
        if (clock && t) setRoll(clock, t);
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  items.forEach((i) => io.observe(i));
}

/* ── Formular RSVP (Netlify Forms) ──────────────────────────────────────── */
export function initForm() {
  const form = $<HTMLFormElement>('[data-rsvp-form]');
  if (!form) return;
  const more = $('[data-if-yes]', form);
  const success = $('[data-rsvp-success]');
  const errorBox = $('[data-form-error]', form);
  const submit = $<HTMLButtonElement>('[data-submit]', form);
  const submitLabel = submit?.querySelector('[data-submit-label]');

  const attending = () => (form.elements.namedItem('prezenta') as RadioNodeList | null)?.value ?? '';

  const showErr = (name: string, show: boolean) => {
    const err = $(`[data-err-for="${name}"]`, form);
    if (err) err.hidden = !show;
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement) field.setAttribute('aria-invalid', String(show));
    if (field instanceof RadioNodeList) {
      field.forEach((r) => (r as HTMLInputElement).setAttribute('aria-invalid', String(show)));
    }
  };

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'prezenta') {
      showErr('prezenta', false);
      const yes = t.value === 'da';
      if (more) {
        more.hidden = !yes;
        more.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((el) => (el.disabled = !yes));
      }
    }
  });
  form.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'nume' && t.value.trim()) showErr('nume', false);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (form.elements.namedItem('nume') as HTMLInputElement).value.trim();
    const att = attending();
    const badName = !name;
    const badAtt = !att;
    showErr('nume', badName);
    showErr('prezenta', badAtt);
    if (badName || badAtt) {
      const first = badName
        ? (form.elements.namedItem('nume') as HTMLInputElement)
        : form.querySelector<HTMLInputElement>('input[name="prezenta"]');
      first?.focus();
      return;
    }
    if (errorBox) errorBox.hidden = true;
    if (submit) submit.disabled = true;
    if (submitLabel && submit) submitLabel.textContent = submit.dataset.sending ?? '…';

    const data = new FormData(form);
    const honeypot = String(data.get('bot-field') ?? '');
    let ok = false;
    try {
      const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      if (honeypot) ok = true;
      else if (local) {
        // În dezvoltare nu există backend Netlify: simulăm succesul.
        console.info('[RSVP] Simulare trimitere (local):', Object.fromEntries(data as unknown as Iterable<[string, string]>));
        await new Promise((r) => setTimeout(r, 700));
        ok = true;
      } else {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
        });
        ok = res.ok;
      }
    } catch {
      ok = false;
    }

    if (submit) submit.disabled = false;
    if (submitLabel && submit) submitLabel.textContent = submit.dataset.label ?? '';
    if (!ok) {
      if (errorBox) errorBox.hidden = false;
      return;
    }
    form.hidden = true;
    $('.rsvp__please')?.setAttribute('hidden', '');
    if (success) {
      success.hidden = false;
      const yes = att === 'da';
      $('[data-success-yes]', success)!.hidden = !yes;
      $('[data-success-no]', success)!.hidden = yes;
      success.focus();
      if (yes) goldBurst($('.success__mark', success));
    }
  });
}

/**
 * Mică explozie de praf auriu când confirmarea „Da" reușește (o singură dată, ~1,4s).
 * Web Animations API, doar transform/opacity; elementele se șterg la final. Fără ea la mișcare redusă.
 */
function goldBurst(anchor: Element | null) {
  if (!anchor || reducedMotion() || !('animate' in Element.prototype)) return;
  const host = anchor.parentElement;
  if (!host) return;
  host.style.position ||= 'relative';
  const box = anchor.getBoundingClientRect();
  const hb = host.getBoundingClientRect();
  const cx = box.left - hb.left + box.width / 2;
  const cy = box.top - hb.top + box.height * 0.45;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i');
    d.className = 'dust';
    d.setAttribute('aria-hidden', 'true');
    const size = 2.5 + (i % 3) * 1.5;
    d.style.cssText = `left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px`;
    host.appendChild(d);
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
    const r = 60 + (i % 4) * 18;
    d.animate(
      [
        { opacity: 0, transform: 'translate3d(0,0,0) scale(0.4)' },
        { opacity: 1, offset: 0.2 },
        { opacity: 0, transform: `translate3d(${Math.cos(a) * r}px, ${Math.sin(a) * r + 24}px, 0) scale(1)` },
      ],
      { duration: 1300 + (i % 5) * 80, delay: 450 + (i % 3) * 40, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'both' },
    ).finished.finally(() => d.remove());
  }
}

/* ── Galerie: puncte carusel (mobil) + lightbox <dialog> ─────────────────── */
export function initGallery() {
  const track = $('[data-gal-track]');
  const items = $$<HTMLButtonElement>('[data-gal-item]').sort(
    (a, b) => Number(a.dataset.galItem) - Number(b.dataset.galItem),
  );
  const dots = $$('.gal__dot');
  if (!track || !items.length) return;

  // Lățimea unui pas se măsoară doar la încărcare / resize (fără layout forțat în timpul scroll-ului).
  let step = 0;
  const measure = () => {
    const a = items[0].getBoundingClientRect();
    const b = items[1]?.getBoundingClientRect();
    step = b ? Math.abs(b.left - a.left) || a.width : a.width;
  };
  new ResizeObserver(measure).observe(track);
  let raf = 0;
  let current = 0;
  track.addEventListener(
    'scroll',
    () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!step) return;
        const i = Math.round(track.scrollLeft / step);
        if (i === current) return;
        current = i;
        dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      });
    },
    { passive: true },
  );

  const dlg = $<HTMLDialogElement>('[data-lightbox]');
  if (!dlg) return;
  const img = $<HTMLImageElement>('[data-lb-img]', dlg)!;
  const sAvif = $<HTMLSourceElement>('[data-lb-avif]', dlg)!;
  const sWebp = $<HTMLSourceElement>('[data-lb-webp]', dlg)!;
  const cap = $('[data-lb-cap]', dlg)!;
  const count = $('[data-lb-count]', dlg)!;
  let idx = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number, dir = 0) => {
    idx = (i + items.length) % items.length;
    const d = items[idx].dataset;
    // Direcția schimbului: poza veche iese într-o parte, cea nouă intră din cealaltă.
    const move = reducedMotion() ? 0 : dir;
    img.style.setProperty('--dir', String(move));
    img.classList.add('is-swapping');
    const apply = () => {
      sAvif.srcset = d.avif ?? '';
      sWebp.srcset = d.webp ?? '';
      img.srcset = d.jpgset ?? '';
      img.src = d.jpg ?? '';
      img.width = Number(d.w);
      img.height = Number(d.h);
      img.alt = d.alt ?? '';
      cap.textContent = d.alt ?? '';
      count.textContent = `${idx + 1} / ${items.length}`;
    };
    if (dlg.open) {
      setTimeout(apply, 180);
    } else apply();
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      if (move && dlg.open && img.animate) {
        img.style.transition = 'none';
        img.classList.remove('is-swapping');
        img
          .animate(
            [
              { opacity: 0, transform: `translateX(${move * 28}px) scale(0.985)` },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          )
          .finished.finally(() => img.style.removeProperty('transition'));
      } else img.classList.remove('is-swapping');
    };
    img.addEventListener('load', done, { once: true });
    setTimeout(done, 900);
  };

  const open = (i: number, from: HTMLElement) => {
    opener = from;
    show(i);
    dlg.showModal();
    lockScroll(true);
  };
  dlg.addEventListener('close', () => {
    lockScroll(false);
    opener?.focus();
  });

  items.forEach((b, i) => b.addEventListener('click', () => open(i, b)));
  $('[data-lb-close]', dlg)?.addEventListener('click', () => dlg.close());
  $('[data-lb-prev]', dlg)?.addEventListener('click', () => show(idx - 1, -1));
  $('[data-lb-next]', dlg)?.addEventListener('click', () => show(idx + 1, 1));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1, -1);
    if (e.key === 'ArrowRight') show(idx + 1, 1);
  });
  // click pe fundal (în afara imaginii și a butoanelor) închide
  let swipedAt = 0;
  dlg.addEventListener('click', (e) => {
    if (Date.now() - swipedAt < 400) return;
    const t = e.target as HTMLElement;
    if (t === dlg || t.matches('[data-lb-fig], .lb__fig picture')) dlg.close();
  });

  // swipe
  let x0 = 0;
  let y0 = 0;
  let tracking = false;
  const fig = $('[data-lb-fig]', dlg)!;
  fig.addEventListener('pointerdown', (e) => {
    tracking = true;
    x0 = e.clientX;
    y0 = e.clientY;
  });
  fig.addEventListener('pointerup', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swipedAt = Date.now();
      show(dx < 0 ? idx + 1 : idx - 1, dx < 0 ? 1 : -1);
    }
  });
  fig.addEventListener('pointercancel', () => (tracking = false));
}
