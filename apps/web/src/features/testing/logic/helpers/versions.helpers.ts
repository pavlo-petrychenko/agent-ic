import {
  NOTE_LINE_BREAK,
  VERSION_DATE_FORMAT,
} from '@/features/testing/constants/versions.constants';

export const noteLines = (note: string | null): string[] =>
  (note ?? '')
    .split(NOTE_LINE_BREAK)
    .map((line) => line.trim())
    .filter((line) => line !== '');

export const formatVersionDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, VERSION_DATE_FORMAT).format(new Date(iso));
