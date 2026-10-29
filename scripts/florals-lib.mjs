// Elementele vectoriale ale decorului floral (orhidee Phalaenopsis, bujor, perle, frunze aurii,
// sclipici). Sunt doar fragmente SVG: build-florals.mjs le compune peste buchetele pictate și
// le rasterizează o singură dată (sharp) în WebP; în pagină nu ajunge niciun filtru.
export const r2 = (n) => Math.round(n * 100) / 100;

let uid = 0;
// umbrele (feGaussianBlur) se folosesc doar la colțurile rasterizate; în SVG-ul ghirlandei, nu
let SHADOW = true;
export const useShadows = (v) => (SHADOW = v);
const sh = (markup) => (SHADOW ? markup : '');
const id = (p) => `${p}${++uid}`;

/** Petală/sepală orientată în sus (−y), baza în (0,0). pointy ∈ [0,1]: 0 = rotundă, 1 = ascuțită. */
function petalPath(L, w, pointy = 0) {
  const t = 0.5 - 0.35 * pointy;
  return `M0 0C${r2(w * 0.22)} ${r2(-L * 0.06)} ${r2(w * 0.56)} ${r2(-L * 0.42)} ${r2(w * 0.5)} ${r2(-L * 0.7)}` +
    `C${r2(w * 0.44)} ${r2(-L * 0.96)} ${r2(w * t * 0.5)} ${r2(-L * 1.02)} 0 ${r2(-L)}` +
    `C${r2(-w * t * 0.5)} ${r2(-L * 1.02)} ${r2(-w * 0.44)} ${r2(-L * 0.96)} ${r2(-w * 0.5)} ${r2(-L * 0.7)}` +
    `C${r2(-w * 0.56)} ${r2(-L * 0.42)} ${r2(-w * 0.22)} ${r2(-L * 0.06)} 0 0Z`;
}
const veins = (L, w, n) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1) - 0.5) * 2; // −1..1
    d += `M0 ${r2(-L * 0.08)}Q${r2(f * w * 0.32)} ${r2(-L * 0.45)} ${r2(f * w * 0.34)} ${r2(-L * (0.86 - Math.abs(f) * 0.14))}`;
  }
  return d;
};

/**
 * Orhidee Phalaenopsis, privită din față: albă, cu centrul roz și buza magenta.
 * Diametru ≈ 200·s. tone: 'white' | 'blush' (petale ușor roz).
 */
export function orchid(x, y, s = 1, rot = 0, tone = 'white') {
  const g = id('o');
  const edge = tone === 'blush' ? '#fbe3ec' : '#fffdfa';
  const mid = tone === 'blush' ? '#f6c9da' : '#fbeef2';
  const parts = [
    // [unghi, lungime, lățime, ascuțire, tip]
    [0, 80, 40, 0.7, 'sep'],
    [146, 78, 38, 0.7, 'sep'],
    [-146, 78, 38, 0.7, 'sep'],
    [66, 84, 92, 0, 'pet'],
    [-66, 84, 92, 0, 'pet'],
  ];
  const body = parts
    .map(([a, L, w, p, k]) => {
      const d = petalPath(L, w, p);
      return `<g transform="rotate(${a})">` +
        `<path d="${d}" fill="url(#${g}r)" stroke="#b98a98" stroke-opacity=".45" stroke-width=".9"/>` +
        `<path d="${d}" fill="url(#${g}s)"/>` +
        `<path d="${veins(L, w, k === 'pet' ? 7 : 5)}" fill="none" stroke="#c9698f" stroke-opacity="${k === 'pet' ? 0.28 : 0.2}" stroke-width=".8"/>` +
        `</g>`;
    })
    .join('');
  // buza (labelum): lobii laterali ridicați, lobul central cu „mustățile" bifurcate
  const lip =
    `<g transform="scale(.82)">` +
    `<path d="M-6 6C-26 2-34 22-24 34-16 42-6 30-4 18Z" fill="url(#${g}l)" stroke="#6d0f35" stroke-opacity=".5" stroke-width=".7"/>` +
    `<path d="M6 6C26 2 34 22 24 34 16 42 6 30 4 18Z" fill="url(#${g}l)" stroke="#6d0f35" stroke-opacity=".5" stroke-width=".7"/>` +
    `<path d="M-9 14C-20 26-16 46-4 52L0 49 4 52C16 46 20 26 9 14 4 10-4 10-9 14Z" fill="url(#${g}l)" stroke="#6d0f35" stroke-opacity=".55" stroke-width=".7"/>` +
    `<path d="M-3 51C-8 58-14 60-17 56M3 51C8 58 14 60 17 56" fill="none" stroke="#a52a5c" stroke-width="1.6" stroke-linecap="round"/>` +
    `<ellipse cx="0" cy="17" rx="7" ry="6" fill="#f3c34f"/>` +
    `<path d="M-4 15h.1M3 14h.1M0 19h.1M-2 22h.1M3 21h.1" stroke="#b6283f" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M-18 18q4 4 7 3M18 18q-4 4-7 3M-20 25q5 3 8 1M20 25q-5 3-8 1" fill="none" stroke="#fbd36b" stroke-opacity=".8" stroke-width="1"/>` +
    `</g>`;
  const column =
    `<path d="M-6 6C-7-6-4-12 0-12 4-12 7-6 6 6 3 9-3 9-6 6Z" fill="url(#${g}c)" stroke="#c48aa0" stroke-opacity=".5" stroke-width=".6"/>`;
  const defs =
    `<radialGradient id="${g}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="86">` +
    `<stop offset="0" stop-color="#c2346e"/><stop offset=".16" stop-color="#e889b0"/><stop offset=".36" stop-color="${mid}"/>` +
    `<stop offset=".8" stop-color="${edge}"/><stop offset="1" stop-color="#efe0e2"/></radialGradient>` +
    `<linearGradient id="${g}s" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#5a2a3a" stop-opacity=".16"/>` +
    `<stop offset=".45" stop-color="#5a2a3a" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient>` +
    `<linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2558f"/><stop offset=".55" stop-color="#b0245e"/><stop offset="1" stop-color="#7c1240"/></linearGradient>` +
    `<linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8fb"/><stop offset="1" stop-color="#e7a9c2"/></linearGradient>`;
  return {
    defs,
    svg: `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${rot}) scale(${s})">` +
      sh(`<g filter="url(#shadow)" opacity=".55" fill="#000">${parts.map(([a, L, w, p]) => `<path transform="rotate(${a})" d="${petalPath(L, w, p)}"/>`).join('')}</g>`) +
      body + lip + column + `</g>`,
  };
}

/** Boboc de orhidee (verde-crem spre roz), pe tulpină arcuită. */
export function orchidBud(x, y, s = 1, rot = 0) {
  const g = id('b');
  return {
    defs: `<radialGradient id="${g}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6f8"/><stop offset=".6" stop-color="#efc6d4"/><stop offset="1" stop-color="#9e7a63"/></radialGradient>`,
    svg: `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${rot}) scale(${s})">` +
      `<path d="M0 0C10-4 18-16 14-28 10-36-2-34-6-24-10-14-6-4 0 0Z" fill="url(#${g})" stroke="#8a6a58" stroke-opacity=".5" stroke-width=".8"/>` +
      `<path d="M2-3C6-12 7-22 4-30" fill="none" stroke="#b7899a" stroke-opacity=".5" stroke-width=".8"/></g>`,
  };
}

/** Bujor: inele de petale ondulate, de la margine spre centru, în tonuri de roz. */
export function peony(x, y, s = 1, rot = 0, palette = 'pink') {
  const P = {
    pink: ['#8f3550', '#d97a93', '#f4b9c4', '#fde3e3'],
    peach: ['#94503a', '#e09a7a', '#f6c8ae', '#fff0e2'],
  }[palette];
  const g = id('p');
  const stroke = `stroke="${P[0]}" stroke-opacity=".4" stroke-width=".9"`;
  // 1) petalele exterioare, largi, întinse în cerc (turtite: floarea e văzută puțin de sus)
  let guard = '';
  for (let i = 0; i < 8; i++) {
    const a = i * 45 + 9 * Math.sin(i * 2.1);
    const L = 86 + 8 * Math.sin(i * 1.3), w = L * 1.02;
    const d = `M0 0C${r2(w * 0.5)} ${r2(-L * 0.1)} ${r2(w * 0.62)} ${r2(-L * 0.7)} ${r2(w * 0.3)} ${r2(-L * 0.96)}` +
      `Q${r2(w * 0.12)} ${r2(-L * 1.06)} 0 ${r2(-L * 0.97)}Q${r2(-w * 0.14)} ${r2(-L * 1.07)} ${r2(-w * 0.32)} ${r2(-L * 0.94)}` +
      `C${r2(-w * 0.62)} ${r2(-L * 0.7)} ${r2(-w * 0.5)} ${r2(-L * 0.1)} 0 0Z`;
    guard += `<path transform="rotate(${r2(a)})" d="${d}" fill="url(#${g}o)" ${stroke}/>`;
  }
  // 2) cupa: rânduri de petale în formă de căuș, din spate (sus, umbrite) spre față (jos, luminoase)
  let cup = '';
  const rows = [
    [-34, 4, 30, 26, 16], [-24, 5, 32, 28, 28], [-12, 5, 34, 28, 34], [0, 4, 38, 26, 32], [12, 3, 42, 24, 24], [22, 2, 48, 22, 13],
  ];
  rows.forEach(([cy, n, w, h, span], ri) => {
    for (let i = 0; i < n; i++) {
      const cx = n === 1 ? 0 : -span + (2 * span * i) / (n - 1) + 3 * Math.sin(i * 3.1 + ri);
      const ww = w * (0.85 + 0.2 * Math.sin(i * 1.9 + ri)), hh = h * (0.9 + 0.15 * Math.cos(i * 2.7));
      const yy = cy + Math.abs(cx) * 0.18;
      const d = `M${r2(cx - ww / 2)} ${r2(yy)}C${r2(cx - ww / 2)} ${r2(yy - hh)} ${r2(cx - ww * 0.1)} ${r2(yy - hh * 1.15)} ${r2(cx + ww * 0.05)} ${r2(yy - hh * 0.98)}` +
        `C${r2(cx + ww * 0.3)} ${r2(yy - hh * 1.12)} ${r2(cx + ww / 2)} ${r2(yy - hh * 0.8)} ${r2(cx + ww / 2)} ${r2(yy)}` +
        `Q${r2(cx)} ${r2(yy + hh * 0.42)} ${r2(cx - ww / 2)} ${r2(yy)}Z`;
      cup += `<path d="${d}" fill="url(#${g}c)" ${stroke}/>`;
    }
  });
  const defs =
    `<radialGradient id="${g}o" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="92">` +
    `<stop offset="0" stop-color="${P[0]}"/><stop offset=".38" stop-color="${P[1]}"/><stop offset=".75" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[3]}"/></radialGradient>` +
    `<linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${P[3]}"/><stop offset=".45" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient>`;
  return {
    defs,
    svg: `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${rot}) scale(${s})">` +
      sh(`<ellipse rx="84" ry="74" fill="#000" opacity=".45" filter="url(#shadow)"/>`) +
      `<g transform="scale(1 .82)">${guard}</g><ellipse cy="-6" rx="44" ry="36" fill="${P[0]}" opacity=".45"/>${cup}</g>`,
  };
}

const ROSE = {
  cream: ['#8a6a45', '#d9c39a', '#f3e6c8', '#fffaf0'],
  blush: ['#7a2c3a', '#c96f7c', '#efb2b0', '#fff0ec'],
  peach: ['#8e4a32', '#de9572', '#f7c6a6', '#fff1e4'],
  wine: ['#2c0410', '#6e1427', '#a8303f', '#e48a95'],
};
/** Trandafir văzut de sus: petale exterioare largi + spirala de petale în căuș din centru. Diametru ≈ 160·s. */
export function rose(x, y, s = 1, rot = 0, palette = 'blush') {
  const P = ROSE[palette];
  const g = id('r');
  const stroke = `stroke="${P[0]}" stroke-opacity=".45" stroke-width=".9"`;
  let outer = '';
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 5 : 6, L = ring ? 62 : 80;
    for (let i = 0; i < n; i++) {
      const a = i * (360 / n) + ring * 34 + 6 * Math.sin(i * 2.4);
      const w = L * 1.1;
      const d = `M0 0C${r2(w * 0.55)} ${r2(-L * 0.12)} ${r2(w * 0.6)} ${r2(-L * 0.78)} ${r2(w * 0.2)} ${r2(-L * 0.98)}` +
        `Q0 ${r2(-L * 1.04)} ${r2(-w * 0.2)} ${r2(-L * 0.98)}C${r2(-w * 0.6)} ${r2(-L * 0.78)} ${r2(-w * 0.55)} ${r2(-L * 0.12)} 0 0Z`;
      outer += `<path transform="rotate(${r2(a)})" d="${d}" fill="url(#${g}o)" ${stroke}/>`;
    }
  }
  // spirala: semilune tot mai mici, rotite cu unghiul de aur
  let spiral = `<circle r="48" fill="url(#${g}d)"/>`;
  for (let k = 0; k < 9; k++) {
    const r = 48 * 0.82 ** k, a0 = k * 137.5, sw = 205 - k * 6;
    const P0 = [Math.cos((a0 * Math.PI) / 180) * r, Math.sin((a0 * Math.PI) / 180) * r];
    const P1 = [Math.cos(((a0 + sw) * Math.PI) / 180) * r, Math.sin(((a0 + sw) * Math.PI) / 180) * r];
    spiral += `<path d="M${r2(P0[0])} ${r2(P0[1])}A${r2(r)} ${r2(r)} 0 1 1 ${r2(P1[0])} ${r2(P1[1])}` +
      `A${r2(r * 1.05)} ${r2(r * 0.62)} ${r2(a0 + sw / 2 + 90)} 0 0 ${r2(P0[0])} ${r2(P0[1])}Z" fill="url(#${g}c)" ${stroke}/>` +
      `<path d="M${r2(P0[0])} ${r2(P0[1])}A${r2(r)} ${r2(r)} 0 1 1 ${r2(P1[0])} ${r2(P1[1])}" fill="none" stroke="${P[3]}" stroke-opacity=".75" stroke-width="${r2(2.2 - k * 0.15)}" stroke-linecap="round"/>`;
  }
  spiral += `<circle r="4" fill="${P[0]}" opacity=".7"/>`;
  const defs =
    `<radialGradient id="${g}o" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82">` +
    `<stop offset="0" stop-color="${P[0]}"/><stop offset=".45" stop-color="${P[1]}"/><stop offset=".8" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[3]}"/></radialGradient>` +
    `<radialGradient id="${g}d" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></radialGradient>` +
    `<radialGradient id="${g}c" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="46">` +
    `<stop offset="0" stop-color="${P[0]}"/><stop offset=".3" stop-color="${P[1]}"/><stop offset=".7" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[3]}"/></radialGradient>`;
  return {
    defs,
    svg: `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${rot}) scale(${s})">` +
      sh(`<circle r="74" fill="#000" opacity=".45" filter="url(#shadow)"/>`) + `${outer}${spiral}</g>`,
  };
}

/** Frunză aurie (sau verde-salvie). */
export function leaf(x, y, s = 1, rot = 0, tone = 'gold') {
  const fill = tone === 'gold' ? 'url(#goldLeaf)' : 'url(#sageLeaf)';
  const vein = tone === 'gold' ? '#7d5a22' : '#2f4a3a';
  return `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${rot}) scale(${s})">` +
    `<path d="M0 0C14-14 44-16 64 0 44 16 14 14 0 0Z" fill="${fill}" stroke="${vein}" stroke-opacity=".5" stroke-width=".8"/>` +
    `<path d="M3 0Q32-2 60 0M18-1l8-6M30-1l9-7M42-1l8-5M18 1l8 6M30 1l9 6M42 1l7 5" fill="none" stroke="${vein}" stroke-opacity=".55" stroke-width=".8"/></g>`;
}

/** Puncte egal distanțate pe un șir de curbe Bézier cubice. */
export function along(segs, gap, offset = 0) {
  const pts = [];
  let acc = gap - offset;
  for (const [p0, p1, p2, p3] of segs) {
    let prev = p0;
    for (let i = 1; i <= 600; i++) {
      const t = i / 600, u = 1 - t;
      const x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0];
      const y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1];
      acc += Math.hypot(x - prev[0], y - prev[1]);
      prev = [x, y];
      if (acc >= gap) {
        pts.push([x, y]);
        acc = 0;
      }
    }
  }
  return pts;
}

/** Șirag de perle pe o curbă; r = raza perlei (perlele alternează puțin ca mărime). */
export function pearls(segs, r = 5) {
  const pts = along(segs, r * 2.35, r);
  const d = 'M' + segs[0][0].join(' ') + segs.map((s) => 'C' + s.slice(1).flat().map(r2).join(' ')).join('');
  return `<path d="${d}" fill="none" stroke="#e8d09a" stroke-opacity=".5" stroke-width="${r2(r * 0.2)}"/>` +
    `<g fill="url(#pearl)" stroke="#6f6048" stroke-opacity=".35" stroke-width=".6">` +
    pts.map(([x, y], i) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(i % 5 === 2 ? r * 0.72 : r)}"/>`).join('') +
    `</g>`;
}

/** Sclipici: steluțe aurii cu patru raze. */
export function sparkles(list) {
  return `<g fill="#fff3cf">` +
    list.map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-8C1-2 2-1 8 0 2 1 1 2 0 8-1 2-2 1-8 0-2-1-1-2 0-8Z" opacity=".9"/>`).join('') +
    `</g>`;
}

export const sharedDefs =
  `<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/><feOffset dx="2" dy="5"/></filter>` +
  `<linearGradient id="goldLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e6b4"/><stop offset=".45" stop-color="#cfa456"/><stop offset="1" stop-color="#8a6526"/></linearGradient>` +
  `<linearGradient id="sageLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb7a2"/><stop offset=".5" stop-color="#5f8169"/><stop offset="1" stop-color="#2f4b3a"/></linearGradient>` +
  `<radialGradient id="pearl" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fffdf6"/><stop offset=".5" stop-color="#eee3cf"/><stop offset=".9" stop-color="#b6a483"/><stop offset="1" stop-color="#8e7d62"/></radialGradient>`;
