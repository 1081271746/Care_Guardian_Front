/**
 * Date helpers. The API stores instants in UTC (ISO with offset) and calendar
 * dates as YYYY-MM-DD. Instants are shown in the browser's timezone; calendar
 * dates are shown as-is (never shifted by a timezone).
 */

const LOCALE = 'es-CO';

function instant(value: string): Date {
  // Legacy rows may arrive without offset; they are UTC.
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
}

/** "2026-11-25" → "25 nov 2026" without timezone shifts. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** UTC instant → "25 nov 2026, 9:30 a. m." in the browser timezone. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = instant(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "14:30:00" or "14:30" → "2:30 p. m." */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
}

/** "hace 3 h", "ayer", "hace 5 días" for activity feeds. */
export function formatRelative(value: string | null | undefined, now = Date.now()): string {
  if (!value) return '—';
  const minutes = Math.round((now - instant(value).getTime()) / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return formatDateTime(value);
}

/** Today's calendar date in the browser timezone, as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Calendar date shifted by N days, as YYYY-MM-DD. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Value for <input type="datetime-local"> (browser time) → UTC ISO for the API. */
export function localInputToISO(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Current browser time formatted for <input type="datetime-local" max>. */
export function nowLocalInput(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function fullName(patient: { nombres: string; apellidos: string } | null | undefined): string {
  return patient ? `${patient.nombres} ${patient.apellidos}`.trim() : '';
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
}
