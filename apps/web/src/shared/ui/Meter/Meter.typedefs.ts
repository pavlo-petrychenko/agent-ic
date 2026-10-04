import type { ComponentProps } from 'react';
import type { ChartColor } from '@/shared/ui/Meter/Meter.constants';

export interface MeterProps extends Omit<ComponentProps<'div'>, 'children' | 'color'> {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
  color?: ChartColor;
}
