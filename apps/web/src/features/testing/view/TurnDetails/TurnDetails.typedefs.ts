import type { StepOutput } from '@/features/testing/typedefs/trace.typedefs';
import type { BadgeTone } from '@/shared/ui/display/Badge';
import type { MetricItem } from '@/shared/ui/display/Metric';

export interface TurnDetailsProps {
  title: string;
  statusLabel: string;
  statusTone: BadgeTone;
  metrics: readonly MetricItem[];
  outputs: readonly StepOutput[];
}
