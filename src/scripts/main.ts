/**
 * Punct de intrare. Partea „ușoară" (reveal, header, countdown, formular, galerie)
 * rulează imediat; GSAP + Lenis se încarcă dinamic, doar dacă utilizatorul
 * nu preferă mișcare redusă.
 */
import { initCountdown } from './countdown';
import { initForm, initGallery, initHeader, initPreload, initReveal, initSchedule } from './ui';

declare global {
  interface Window {
    __ddReady?: boolean;
  }
}
window.__ddReady = true;

initHeader();
initReveal();
initCountdown();
initSchedule();
initForm();
initGallery();
initPreload();

const html = document.documentElement;
if (html.classList.contains('motion-ok')) {
  import('./motion')
    .then((m) => m.initMotion())
    .catch((err) => {
      console.error('[motion]', err);
      // Fără animații: revenim la layout-ul static.
      html.classList.remove('motion-ok');
    });
}
