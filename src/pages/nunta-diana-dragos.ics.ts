// Generează la build fișierul static /nunta-diana-dragos.ics din datele din wedding.ts
// (rămâne sincronizat automat cu data și locația).
import type { APIRoute } from 'astro';
import { countdown, date, events } from '../data/wedding';

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

/** Pliază liniile lungi (max. 75 octeți) conform RFC 5545. */
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
    }
    cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export const GET: APIRoute = ({ site }) => {
  const first = events.items[0];
  const url = site?.href ?? '';
  const description =
    events.items.map((e) => `${e.type} – ${e.time}, ${e.place}, ${e.address}`).join('\n') + '\n' + url;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Diana si Dragos//Invitatie//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:nunta-diana-dragos-${stamp(date.start)}@invitatie`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(date.start)}`,
    `DTEND:${stamp(date.end)}`,
    `SUMMARY:${esc(countdown.calendarTitle)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(`${first.place}, ${first.address}`)}`,
    `GEO:${first.lat};${first.lng}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(countdown.calendarTitle)} – mâine!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
