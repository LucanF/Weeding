/** Construiește linkul WhatsApp din câmpurile (opționale) ale formularului. */
export interface RsvpWaConfig {
  number: string;
  defaultMessage: string;
  introYes: string;
  introNo: string;
  labels: Record<'name' | 'names' | 'attending' | 'yes' | 'no' | 'guests' | 'message', string>;
  /** Etichete pentru câmpurile de nume (folosite doar de formular). */
  nameLabel: string;
  nameLabelN: string;
  namePh: string;
}
export interface RsvpValues {
  names?: string[];
  attending?: string; // 'da' | 'nu' | ''
  guests?: string;
  message?: string;
}

export function buildRsvpMessage(c: RsvpWaConfig, v: RsvpValues): string {
  const t = (s?: string) => (s ?? '').trim();
  const no = v.attending === 'nu';
  // La răspuns negativ contează un singur nume.
  const names = (v.names ?? []).slice(0, no ? 1 : undefined).map(t).filter(Boolean);
  const lines: string[] = [];
  const add = (k: string, val: string) => val && lines.push(`${k}: ${val}`);

  add(c.labels.attending, v.attending === 'da' ? c.labels.yes : no ? c.labels.no : '');
  // Numărul de persoane nu are sens dacă nu participă.
  if (!no) add(c.labels.guests, t(v.guests));
  if (names.length > 1) {
    lines.push(`${c.labels.names}:`, ...names.map((n, i) => `${i + 1}. ${n}`));
  } else {
    add(c.labels.name, names[0] ?? '');
  }
  add(c.labels.message, t(v.message));

  if (!lines.length) return c.defaultMessage;
  return [no ? c.introNo : c.introYes, ...lines].join('\n');
}

export function buildRsvpUrl(c: RsvpWaConfig, v: RsvpValues): string {
  return `https://wa.me/${c.number.replace(/\D/g, '')}?text=${encodeURIComponent(buildRsvpMessage(c, v))}`;
}
