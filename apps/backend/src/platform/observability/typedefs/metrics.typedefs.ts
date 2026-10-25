import type { ExemplarLabel } from '@/platform/observability/constants/metrics.constants';

export type ExemplarLabels = Readonly<Record<ExemplarLabel, string>>;
