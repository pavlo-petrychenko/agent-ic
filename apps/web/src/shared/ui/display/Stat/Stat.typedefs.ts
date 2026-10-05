import type { ComponentProps } from 'react';
import type { StatTrendTone } from '@/shared/ui/display/Stat/Stat.constants';

export interface StatTrend {
  label: string;
  tone: StatTrendTone;
}

export interface StatProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: string;
  value: string | number;
  sub?: string | null;
  trend?: StatTrend | null;
  loading?: boolean;
}
