import type { ComponentProps } from 'react';
import type { MeterTone } from '@/shared/ui/Meter/Meter.constants';

export interface MeterProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
  tone?: MeterTone | null;
}
