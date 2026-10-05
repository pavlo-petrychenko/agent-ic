import {
  CRON_FIELD_RANGES,
  CRON_FIELD_SEPARATOR,
  CRON_LIST_SEPARATOR,
  CRON_NUMBER_PATTERN,
  CRON_RANGE_SEPARATOR,
  CRON_STEP_SEPARATOR,
  CRON_WILDCARD,
  TIME_ZONE_PROBE_LOCALE,
} from '@flow/validation/constants/schedule.constants';

const inRange = (text: string, [min, max]: readonly [number, number]): boolean =>
  CRON_NUMBER_PATTERN.test(text) && Number(text) >= min && Number(text) <= max;

const isValidBase = (base: string, range: readonly [number, number]): boolean => {
  if (base === CRON_WILDCARD) {
    return true;
  }
  const bounds = base.split(CRON_RANGE_SEPARATOR);
  if (bounds.length === 1) {
    return inRange(base, range);
  }
  const [from, to] = bounds;
  return (
    bounds.length === 2 &&
    from !== undefined &&
    to !== undefined &&
    inRange(from, range) &&
    inRange(to, range) &&
    Number(from) <= Number(to)
  );
};

const isValidItem = (item: string, range: readonly [number, number]): boolean => {
  const parts = item.split(CRON_STEP_SEPARATOR);
  const [base, step] = parts;
  if (base === undefined || parts.length > 2) {
    return false;
  }
  const validStep = step === undefined || (CRON_NUMBER_PATTERN.test(step) && Number(step) > 0);
  return validStep && isValidBase(base, range);
};

export const isValidCron = (expression: string): boolean => {
  const fields = expression.trim().split(CRON_FIELD_SEPARATOR);
  return (
    fields.length === CRON_FIELD_RANGES.length &&
    fields.every((fieldText, index) => {
      const range = CRON_FIELD_RANGES[index];
      return (
        range !== undefined &&
        fieldText.split(CRON_LIST_SEPARATOR).every((item) => isValidItem(item, range))
      );
    })
  );
};

export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat(TIME_ZONE_PROBE_LOCALE, { timeZone });
    return true;
  } catch {
    return false;
  }
};
