import type { DurationUnit } from '@/shared/forms/constants/duration.constants';

export interface DurationParts {
  readonly amount: number;
  readonly unit: DurationUnit;
}
