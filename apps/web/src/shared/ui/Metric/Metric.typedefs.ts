import type { ComponentProps } from 'react';

export interface MetricItem {
  label: string;
  value: string;
}

export interface MetricProps extends Omit<ComponentProps<'dl'>, 'children'> {
  items: readonly MetricItem[];
}
