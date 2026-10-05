export const CRON_FIELD_RANGES: readonly (readonly [number, number])[] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

export const CRON_WILDCARD = '*';
export const CRON_LIST_SEPARATOR = ',';
export const CRON_STEP_SEPARATOR = '/';
export const CRON_RANGE_SEPARATOR = '-';
export const CRON_FIELD_SEPARATOR = /\s+/;
export const CRON_NUMBER_PATTERN = /^\d+$/;
export const TIME_ZONE_PROBE_LOCALE = 'en';
