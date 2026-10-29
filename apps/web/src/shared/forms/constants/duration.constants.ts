export enum DurationUnit {
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
}

export const MINUTES_PER_UNIT: Readonly<Record<DurationUnit, number>> = {
  [DurationUnit.Minute]: 1,
  [DurationUnit.Hour]: 60,
  [DurationUnit.Day]: 1440,
};

export const DURATION_UNIT_ORDER: readonly DurationUnit[] = [
  DurationUnit.Minute,
  DurationUnit.Hour,
  DurationUnit.Day,
];

export const DURATION_INPUT_MIN = 1;
