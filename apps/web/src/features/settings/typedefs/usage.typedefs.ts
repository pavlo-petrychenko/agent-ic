import type { UsageFormat } from '@/features/settings/constants/usage.constants';

export interface UsageMetric {
  readonly id: string;
  readonly labelKey: string;
  readonly noteKey: string;
  readonly format: UsageFormat;
  readonly used: number;
  readonly limit: number;
}
