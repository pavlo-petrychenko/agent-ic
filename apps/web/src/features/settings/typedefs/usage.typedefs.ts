import type { UsageFormat, UsageMetricKey } from '@/features/settings/constants/usage.constants';

export interface UsageMeterView {
  readonly used: number;
  readonly limit: number;
}

export interface WorkspaceUsageView {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly meters: Readonly<Record<UsageMetricKey, UsageMeterView>>;
}

export interface UsageStatusView {
  readonly limitReached: boolean;
  readonly reachedAt: string | null;
  readonly periodEnd: string;
}

export interface UsageRowDefinition {
  readonly key: UsageMetricKey;
  readonly labelKey: string;
  readonly noteKey: string;
  readonly format: UsageFormat;
}

export interface UseWorkspaceUsageResult {
  readonly usage: WorkspaceUsageView | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UseUsageStatusResult {
  readonly status: UsageStatusView | null;
  readonly limitReached: boolean;
}

export enum UsageWhenKind {
  Today = 'today',
  On = 'on',
  Unknown = 'unknown',
}

export interface UsageWhen {
  readonly kind: UsageWhenKind;
  readonly date: string | null;
}
