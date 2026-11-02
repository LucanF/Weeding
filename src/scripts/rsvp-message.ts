/** Construiește linkul WhatsApp din câmpurile (opționale) ale formularului. */
export interface RsvpWaConfig {
  number: string;
  defaultMessage: string;
  introYes: string;
  introNo: string;
  labels: Record<'name' | 'attending' | 'yes' | 'no' | 'guests' | 'menu' | 'allergies' | 'message', string>;
}
export interface RsvpValues {
  name?: string;
  attending?: string; // 'da' | 'nu' | ''
  guests?: string;
  menu?: string;
  allergies?: string;
  message?: string;
}

export function buildRsvpMessage(c: RsvpWaConfig, v: RsvpValues): string {
  const t = (s?: string) => (s ?? '').trim();
  const no = v.attending === 'nu';
  const lines: [string, string][] = [
    [c.labels.name, t(v.name)],
    [c.labels.attending, v.attending === 'da' ? c.labels.yes : no ? c.labels.no : ''],
    // Numărul de persoane, meniul și alergiile nu au sens dacă nu participă.
    [c.labels.guests, no ? '' : t(v.guests)],
    [c.labels.menu, no ? '' : t(v.menu)],
    [c.labels.allergies, no ? '' : t(v.allergies)],
    [c.labels.message, t(v.message)],
  ];
  const filled = lines.filter(([, val]) => val);
  if (!filled.length) return c.defaultMessage;
  return [no ? c.introNo : c.introYes, ...filled.map(([k, val]) => `${k}: ${val}`)].join('\n');
}

export function buildRsvpUrl(c: RsvpWaConfig, v: RsvpValues): string {
  return `https://wa.me/${c.number.replace(/\D/g, '')}?text=${encodeURIComponent(buildRsvpMessage(c, v))}`;
}
