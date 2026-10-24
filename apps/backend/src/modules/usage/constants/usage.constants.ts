export const USAGE_SCHEMA = 'usage';

export const KNOWLEDGE_CHUNKS_UNTRACKED = 0;

export const NO_USAGE = 0;

export const PERCENT_OF_LIMIT = 100;

export enum UsageThreshold {
  Warn = 80,
  Limit = 100,
}

export const USAGE_THRESHOLDS: readonly UsageThreshold[] = [
  UsageThreshold.Warn,
  UsageThreshold.Limit,
];

export const USAGE_PERIOD_SEPARATOR = '-';
export const USAGE_PERIOD_MONTH_DIGITS = 2;
export const USAGE_PERIOD_MONTH_PAD = '0';
export const USAGE_PERIOD_PATTERN = '^[0-9]{4}-[0-9]{2}$';

export const CREDITS_PRECISION = 14;
export const CREDITS_SCALE = 4;

export const USAGE_LIMIT_REACHED_MESSAGE = 'the monthly usage limit of the workspace is reached';
