import type { UsageThreshold } from '@/modules/usage/constants/usage.constants';

export interface UsagePeriod {
  readonly key: string;
  readonly start: Date;
  readonly end: Date;
}

export interface UsageCounter {
  readonly id: string;
  readonly workspaceId: string;
  readonly period: string;
  readonly credits: number;
  readonly conversations: number;
  readonly warned80At: Date | null;
  readonly warned100At: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UsageCounterKey {
  readonly id: string;
  readonly workspaceId: string;
  readonly period: string;
  readonly at: Date;
}

export interface WorkspaceLimitOverrides {
  readonly creditsLimit: number | null;
  readonly conversationsLimit: number | null;
  readonly chunksLimit: number | null;
}

export interface EffectiveUsageLimits {
  readonly credits: number;
  readonly conversations: number;
  readonly chunks: number;
}

export interface UsageMeter {
  readonly used: number;
  readonly limit: number;
}

export interface WorkspaceUsage {
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly credits: UsageMeter;
  readonly conversations: UsageMeter;
  readonly chunks: UsageMeter;
}

export interface UsageStatus {
  readonly limitReached: boolean;
  readonly reachedAt: Date | null;
  readonly periodEnd: Date;
}

export type UsageThresholdReachedInput = {
  readonly workspaceId: string;
  readonly threshold: UsageThreshold;
};
