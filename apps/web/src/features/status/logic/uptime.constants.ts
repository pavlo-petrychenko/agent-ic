export enum UptimeUnit {
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute',
  Second = 'second',
}

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const SECONDS_PER_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = HOURS_PER_DAY * SECONDS_PER_HOUR;
const SECONDS_PER_SECOND = 1;

export const UPTIME_UNITS_DESCENDING: readonly {
  readonly unit: UptimeUnit;
  readonly seconds: number;
}[] = [
  { unit: UptimeUnit.Day, seconds: SECONDS_PER_DAY },
  { unit: UptimeUnit.Hour, seconds: SECONDS_PER_HOUR },
  { unit: UptimeUnit.Minute, seconds: SECONDS_PER_MINUTE },
  { unit: UptimeUnit.Second, seconds: SECONDS_PER_SECOND },
];

export const UPTIME_MAX_UNITS = 2;
export const UPTIME_UNIT_SEPARATOR = ' ';
