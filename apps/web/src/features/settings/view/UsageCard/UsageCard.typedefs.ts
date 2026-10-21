import type { ProgressTone } from '@/shared/ui/display/Progress/Progress.constants';

export interface UsageRow {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  readonly value: string;
  readonly used: number;
  readonly limit: number;
  readonly tone: ProgressTone;
}

export interface UsageCardProps {
  readonly periodLabel: string;
  readonly rows: readonly UsageRow[];
}
