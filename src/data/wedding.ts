/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TOT CONȚINUTUL SITE-ULUI ESTE AICI.
 *  Caută „TODO" pentru ce trebuie înlocuit cu informațiile reale.
 *  Textele sunt grupate pe secțiuni, ca să poată fi traduse ușor ulterior
 *  (ex.: un al doilea fișier wedding.en.ts cu aceeași structură).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Mirii ────────────────────────────────────────────────────────────────────
export const couple = {
  bride: 'Diana',
  groom: 'Dragoș',
  /** Inițialele pentru monogramă (font script). */
  monogram: ['D', 'D'] as const,
  hashtag: '#DianaȘiDragoș', // TODO: hashtag real (sau șterge-l)
};

// ── Data și ora ──────────────────────────────────────────────────────────────
// Format ISO cu fusul orar al României (vara +03:00, iarna +02:00).
// Countdown-ul numără până la `start` (ora cununiei religioase).
export const date = {
  start: '2027-05-29T15:00:00+03:00',
  end: '2027-05-30T04:00:00+03:00',
  timeZone: 'Europe/Bucharest',
  /** Afișări textuale (păstrează-le sincronizate cu `start`). */
  long: 'Sâmbătă, 29 mai 2027',
  short: '29 · 05 · 2027',
  day: '29',
  month: 'mai',
  year: '2027',
  weekday: 'sâmbătă',
  rsvpDeadline: '1 mai 2027', // TODO: de confirmat cu mirii
};

// ── Metadate (titlu tab, preview WhatsApp/Facebook) ─────────────────────────
export const meta = {
  title: 'Diana & Dragoș – Ne căsătorim!',
  description: `Vă invităm cu drag la nunta noastră, ${date.long.toLowerCase()}. Detalii, program și confirmare.`,
  ogTitle: 'Diana & Dragoș – Ne căsătorim!',
  ogDescription: `${date.long} · Vă așteptăm cu drag să sărbătorim împreună.`,
  themeColor: '#0B2418',
};

// ── Navigație (ancore) ───────────────────────────────────────────────────────
export const nav = [
  { href: '#povestea', label: 'Povestea' },
  { href: '#detalii', label: 'Detalii' },
  { href: '#program', label: 'Program' },
  { href: '#galerie', label: 'Galerie' },
  { href: '#info', label: 'Info' },
];

// ── 1. Hero ──────────────────────────────────────────────────────────────────
export const hero = {
  title: 'Diana și Dragoș',
  tagline: 'Noi doi, de la întâlnire la totdeauna.',
  eyebrow: 'Ne căsătorim',
  scrollHint: 'Derulează',
};

// ── 2. Invitația ─────────────────────────────────────────────────────────────
export const invitation = {
  kicker: 'Invitație',
  // `names` poate fi un text sau o listă de rânduri (ex. părinți despărțiți: fiecare pe rândul lui).
  parents: [
    { label: 'Părinții miresei', names: ['Nicoleta & Pavel Ivan'] },
    { label: 'Părinții mirelui', names: ['Mihaela Oana', 'Bogdan Spridon & Camelia Oprișan'] },
  ],
  godparents: { label: 'Alături de dragii noștri nași', names: ['Alexandra & Alexandru Neagoe'] },
  /** Fraza principală (din invitația tipărită) – se „luminează" cuvânt cu cuvânt la scroll. */
  text: 'Alături de părinții noștri, ne bucurăm să vă invităm să ne fiți alături în ziua în care îi dăm iubirii un nume pentru totdeauna!',
};

// ── 3. Countdown ─────────────────────────────────────────────────────────────
export const countdown = {
  kicker: 'Până la marele „DA"',
  title: 'Numărăm clipele',
  units: { days: 'zile', hours: 'ore', minutes: 'minute', seconds: 'secunde' },
  done: 'Ne-am căsătorit!',
  doneSub: 'Vă mulțumim că ați fost alături de noi.',
  calendarTitle: 'Nunta Dianei și a lui Dragoș',
  calendarDetails: 'Cununia religioasă și petrecerea. Detalii: ',
  addToCalendar: 'Adaugă în calendar',
  google: 'Google Calendar',
  ics: 'Apple / Outlook (.ics)',
  icsFile: '/nunta-diana-dragos.ics',
};

// ── 4. Povestea noastră ──────────────────────────────────────────────────────
// TODO: povestea reală (4 momente). `photo` = cheie din src/data/photos.ts.
export const story = {
  kicker: 'Povestea noastră',
  title: 'De la „bună" la „pentru totdeauna"',
  moments: [
    {
      year: '2017',
      title: 'Prima privire',
      text: 'O seară de toamnă, prieteni noi și o conversație ce nu a vrut să se termine. Am râs de aceleași glume și am știut, fără să ne-o spunem, că e începutul a ceva frumos.',
      photo: 'primaPrivire',
    },
    {
      year: '15 Decembrie 2024',
      title: 'Întrebarea',
      text: 'Al 3-lea an de împodobit bradul în aceeași chirie… Dragoș a îngenunchiat. Răspunsul a venit înainte să termine întrebarea.',
      photo: 'intrebarea',
    },
    {
      year: '2025',
      title: 'Primul nostru „acasă”',
      text: 'Am păstrat visul acesta doar pentru noi, departe de ochii lumii, până când a venit momentul să-i deschidem ușa. Am găsit locul unde povestea noastră avea să crească.',
      photo: 'primulAcasa',
    },
    {
      year: '06.09.2025',
      title: 'Cununia civilă',
      text: 'O zi însorită de toamnă, o rochie albă și un costum albastru. Am semnat, am râs mult și am promis că aceasta a fost abia începutul! Și așa am învățat că „acasă” este „cineva”, nu „undeva”.',
      photo: 'civila',
    },
  ],
  finale: {
    kicker: 'Și apoi',
    title: 'Am spus DA',
    text: 'Acum vrem să spunem DA încă o dată — în fața lui Dumnezeu și alături de voi.',
  },
} as const;

// ── 5. Detalii eveniment ─────────────────────────────────────────────────────
export const events = {
  kicker: 'Unde și când',
  title: 'Detaliile zilei',
  intro: 'Două locuri, o singură zi. Vă așteptăm la ambele.',
  items: [
    {
      id: 'cununie',
      type: 'Cununia religioasă',
      time: '15:00',
      place: 'Biserica „Sfinții Împărați Constantin și Elena"',
      address: 'Strada Alexandru Odobescu 10, Brașov',
      lat: 45.63799,
      lng: 25.61635,
      note: '',
    },
    {
      id: 'petrecere',
      type: 'Petrecerea',
      time: '18:00',
      place: 'Restaurant Diamant',
      address: 'Strada Făgărașului 44, Ghimbav, jud. Brașov',
      lat: 45.66575,
      lng: 25.51344,
      note: 'Parcare în incintă.',
    },
  ],
  routeLabel: '≈ 20 min cu mașina',
  maps: { google: 'Google Maps', waze: 'Waze', apple: 'Apple Maps' },
};

// ── 6. Programul zilei ───────────────────────────────────────────────────────
// TODO: de confirmat orele intermediare cu mirii. `icon` ∈ ring | church | glass | plate | music | cake | spark
export const schedule = {
  kicker: 'Programul zilei',
  title: 'O zi, pas cu pas',
  items: [
    { time: '14:30', title: 'Sosirea invitaților', text: 'Ne revedem în fața bisericii.', icon: 'spark' },
    { time: '15:00', title: 'Cununia religioasă', text: 'Momentul nostru, în fața altarului.', icon: 'church' },
    { time: '16:30', title: 'Ședința foto', text: 'Câteva cadre cu voi, după slujbă.', icon: 'ring' },
    { time: '18:00', title: 'Bun venit la Diamant', text: 'Ne bucurăm de primul pahar împreună.', icon: 'glass' },
    { time: '20:00', title: 'Cina', text: 'Bucate alese și primul toast.', icon: 'plate' },
    { time: '21:30', title: 'Primul dans', text: 'Apoi ringul e al vostru.', icon: 'music' },
    { time: '00:00', title: 'Tortul', text: 'Dulce, ca toată ziua.', icon: 'cake' },
  ],
} as const;

// ── 8. Galerie ───────────────────────────────────────────────────────────────
export const gallery = {
  kicker: 'Galerie',
  title: 'Câteva clipe',
  hint: 'Atinge o fotografie pentru a o mări',
  close: 'Închide',
  prev: 'Fotografia anterioară',
  next: 'Fotografia următoare',
};

// ── 9. RSVP ──────────────────────────────────────────────────────────────────
// TODO: număr WhatsApp real, în format internațional fără „+" sau spații.
export const rsvp = {
  kicker: 'Confirmare',
  title: 'Ne confirmați prezența?',
  intro: `Vă rugăm să ne răspundeți până pe ${date.rsvpDeadline}. Ne ajută enorm la organizare.`,
  formName: 'rsvp',
  fields: {
    name: 'Nume și prenume',
    namePh: 'ex. Ana Popescu',
    attending: 'Veți fi alături de noi?',
    yes: 'Da, cu drag!',
    no: 'Din păcate, nu',
    guests: 'Număr de persoane',
    menu: 'Preferință meniu',
    menuOptions: ['Standard', 'Vegetarian', 'Vegan', 'Meniu copil'],
    allergies: 'Alergii sau restricții alimentare',
    allergiesPh: 'ex. fără gluten',
    message: 'Un gând pentru noi (opțional)',
    messagePh: 'Abia așteptăm!',
  },
  errors: {
    name: 'Vă rugăm să ne spuneți numele.',
    attending: 'Vă rugăm să alegeți o variantă.',
    generic: 'Nu am putut trimite răspunsul. Încercați din nou sau scrieți-ne pe WhatsApp.',
  },
  submit: 'Trimite confirmarea',
  sending: 'Se trimite…',
  successTitle: 'Mulțumim!',
  successYes: 'Abia așteptăm să sărbătorim împreună.',
  successNo: 'Ne pare rău că nu puteți veni. Vă mulțumim că ne-ați anunțat.',
  or: 'sau',
  whatsapp: 'Confirmă pe WhatsApp',
  whatsappNumber: '40700000000', // TODO
  whatsappMessage: `Bună, Diana și Dragoș! Confirm prezența la nunta voastră din ${date.day} ${date.month} ${date.year}. Nume: … Număr persoane: …`,
};

// ── 10. Info utile ───────────────────────────────────────────────────────────
// TODO: informații reale.
export const info = {
  kicker: 'Bine de știut',
  title: 'Info utile',
  items: [
    {
      q: 'Cazare',
      a: 'Am rezervat un număr limitat de camere la Pensiunea Teiul (5 min de locație), cu tarif preferențial. Menționați „Nunta D&D" la rezervare: 0269 000 000.',
    },
    {
      q: 'Transport',
      a: 'Locația are parcare gratuită. Pentru cei care nu conduc, un microbuz va face curse spre Sibiu la 01:00 și 03:00.',
    },
    {
      q: 'Copii',
      a: 'Cei mici sunt bineveniți! Vom avea un colț de joacă și un meniu dedicat. Vă rugăm să-i includeți în numărul de persoane la confirmare.',
    },
    {
      q: 'Contact',
      a: 'Pentru orice întrebare: Diana – 0700 000 000, Dragoș – 0700 000 001, sau organizatoarea noastră, Ioana – 0700 000 002.',
    },
  ],
};

// ── 11. Final ────────────────────────────────────────────────────────────────
export const finale = {
  title: 'Vă așteptăm cu drag',
  text: 'Pentru că cele mai frumoase povești se scriu împreună.',
  signature: 'Diana & Dragoș',
};

export const footer = {
  made: 'Făcut cu drag pentru ziua noastră',
  top: 'Înapoi sus',
};
