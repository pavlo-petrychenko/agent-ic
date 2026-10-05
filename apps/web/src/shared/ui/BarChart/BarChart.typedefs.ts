import type { ChartEmptyText } from '@/shared/ui/BarChart/ChartPlaceholder';

export interface BarDatum {
  category: string;
  value: number;
  tooltipLabel: string | null;
}

export interface BarChartProps {
  data: readonly BarDatum[];
  ariaLabel: string;
  formatValue: (value: number) => string;
  formatY?: ((value: number) => string) | null;
  yTicks?: readonly number[] | null;
  yDomain?: readonly [number, number] | null;
  height?: number;
  onHighlight?: ((index: number | null) => void) | null;
  loading?: boolean;
  loadingLabel?: string | null;
  empty?: ChartEmptyText | null;
  className?: string;
}
