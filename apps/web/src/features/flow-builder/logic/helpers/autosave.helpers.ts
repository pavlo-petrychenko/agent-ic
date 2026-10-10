import { SAVED_AT_FORMAT } from '@/features/flow-builder/constants/autosave.constants';

export const formatSavedAt = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, SAVED_AT_FORMAT).format(Date.parse(iso));
