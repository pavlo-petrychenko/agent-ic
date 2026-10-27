import {
  LastUpdateKind,
  type LastUpdateLabel,
} from '@/features/channels/typedefs/lastUpdate.typedefs';

const sameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatTime = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);

const formatDay = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);

export const lastUpdateLabel = (iso: string, now: Date, locale: string): LastUpdateLabel => {
  const updatedAt = new Date(iso);
  const time = formatTime(updatedAt, locale);
  return sameDay(updatedAt, now)
    ? { kind: LastUpdateKind.Today, time, date: null }
    : { kind: LastUpdateKind.Earlier, time, date: formatDay(updatedAt, locale) };
};
