/**
 * Cifre care „se rotesc" vertical la schimbare (countdown, ceasul din program).
 * Doar transform prin animație CSS (.is-rolling); fără aria-live.
 */
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setRoll(el: HTMLElement, text: string, animate = true) {
  const chars = [...text];
  if (!el.dataset.rollInit) {
    el.textContent = '';
    el.dataset.rollInit = '1';
  }
  while (el.children.length < chars.length) {
    const d = document.createElement('span');
    d.className = 'dg';
    el.appendChild(d);
  }
  while (el.children.length > chars.length) el.lastElementChild?.remove();

  chars.forEach((c, i) => {
    const dg = el.children[i] as HTMLElement;
    const cur = dg.dataset.v;
    if (cur === c) return;
    dg.dataset.v = c;
    if (!animate || cur === undefined || reduced() || document.hidden) {
      dg.classList.remove('is-rolling');
      dg.innerHTML = `<span>${c}</span>`;
      return;
    }
    dg.classList.remove('is-rolling');
    dg.innerHTML = `<span>${cur}</span><span>${c}</span>`;
    void dg.offsetWidth; // repornește animația
    dg.classList.add('is-rolling');
    dg.lastElementChild?.addEventListener(
      'animationend',
      () => {
        if (dg.dataset.v !== c) return;
        dg.classList.remove('is-rolling');
        dg.innerHTML = `<span>${c}</span>`;
      },
      { once: true },
    );
  });
}
