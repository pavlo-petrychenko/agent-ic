import {
  PERCENT_OF_LIMIT,
  USAGE_THRESHOLDS,
  UsageThreshold,
} from '@/modules/usage/constants/usage.constants';
import type {
  EffectiveUsageLimits,
  UsageCounter,
  WorkspaceLimitOverrides,
} from '@/modules/usage/typedefs/usage.typedefs';
import type { UsageConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const effectiveLimitsOf = (
  defaults: UsageConfig,
  overrides: WorkspaceLimitOverrides | null,
): EffectiveUsageLimits => ({
  credits: overrides?.creditsLimit ?? defaults.creditsLimit,
  conversations: overrides?.conversationsLimit ?? defaults.conversationsLimit,
  chunks: overrides?.chunksLimit ?? defaults.chunksLimit,
});

export const creditLimitReached = (used: number, limit: number): boolean => used >= limit;

export const thresholdReached = (used: number, limit: number, threshold: UsageThreshold): boolean =>
  used * PERCENT_OF_LIMIT >= limit * threshold;

export const warnedAt = (counter: UsageCounter, threshold: UsageThreshold): Date | null => {
  switch (threshold) {
    case UsageThreshold.Warn:
      return counter.warned80At;
    case UsageThreshold.Limit:
      return counter.warned100At;
  }
};

export const unwarnedThresholds = (
  counter: UsageCounter,
  limit: number,
): readonly UsageThreshold[] =>
  USAGE_THRESHOLDS.filter(
    (threshold) =>
      thresholdReached(counter.credits, limit, threshold) && warnedAt(counter, threshold) === null,
  );
