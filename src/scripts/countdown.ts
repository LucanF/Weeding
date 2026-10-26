import { setRoll } from './roller';

/** Countdown până la ora din data-target (ISO cu offset → independent de fusul vizitatorului). */
export function initCountdown() {
  const root = document.querySelector<HTMLElement>('[data-countdown]');
  if (!root) return;
  const target = Date.parse(root.dataset.target ?? '');
  if (Number.isNaN(target)) return;

  const grid = root.querySelector<HTMLElement>('[data-cd-grid]');
  const done = root.querySelector<HTMLElement>('[data-cd-done]');
  const sr = root.querySelector<HTMLElement>('[data-cd-sr]');
  const els = {
    days: root.querySelector<HTMLElement>('[data-cd="days"]'),
    hours: root.querySelector<HTMLElement>('[data-cd="hours"]'),
    minutes: root.querySelector<HTMLElement>('[data-cd="minutes"]'),
    seconds: root.querySelector<HTMLElement>('[data-cd="seconds"]'),
  };
  const pad = (n: number) => String(n).padStart(2, '0');

  let timer = 0;
  let first = true;

  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      grid?.setAttribute('hidden', '');
      done?.removeAttribute('hidden');
      if (sr) sr.textContent = '';
      stop();
      return;
    }
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (els.days) setRoll(els.days, pad(d), !first);
    if (els.hours) setRoll(els.hours, pad(h), !first);
    if (els.minutes) setRoll(els.minutes, pad(m), !first);
    if (els.seconds) setRoll(els.seconds, pad(sec), !first);
    if (first && sr) {
      // Text static pentru cititoare de ecran (fără anunțuri la fiecare secundă).
      sr.textContent = `Mai sunt ${d} zile, ${h} ore și ${m} minute până la nuntă.`;
    }
    first = false;
  };

  const start = () => {
    if (timer) return;
    tick();
    // aliniat la începutul secundei
    timer = window.setTimeout(function loop() {
      tick();
      if (timer) timer = window.setTimeout(loop, 1000 - (Date.now() % 1000));
    }, 1000 - (Date.now() % 1000));
  };
  const stop = () => {
    clearTimeout(timer);
    timer = 0;
  };

  tick();
  // Rulează doar când secțiunea e vizibilă (economie de baterie).
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '100px' }).observe(root);
}
