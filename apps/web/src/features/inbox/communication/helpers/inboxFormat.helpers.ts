const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_DAY = 86_400_000;

export const minutesAgo = (iso: string): number =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / MILLISECONDS_PER_MINUTE));

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const relativeDay = (iso: string, locale: string): string => {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / MILLISECONDS_PER_DAY);
  if (days === 0 || days === 1) {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day');
    return relative.charAt(0).toLocaleUpperCase(locale) + relative.slice(1);
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

export const messageTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const dateTime = (iso: string, locale: string): string =>
  `${relativeDay(iso, locale)}, ${messageTime(iso, locale)}`;

export const duration = (durationMs: number | null, locale: string): string =>
  durationMs === null
    ? '—'
    : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(durationMs / MILLISECONDS_PER_SECOND)} s`;

export const runTime = (startedAt: string | null, locale: string): string =>
  startedAt === null ? '—' : messageTime(startedAt, locale);
