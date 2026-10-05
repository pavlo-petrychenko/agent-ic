import type { ChartEmptyText } from '@/shared/ui/BarChart';
import type { ChartColor } from '@/shared/ui/Legend';
import type { LineChartLegend } from '@/shared/ui/LineChart/LineChart.constants';

export interface LinePoint {
  x: string;
  y: number | null;
}

export interface LineSeries {
  id: string;
  label: string;
  points: readonly LinePoint[];
  color: ChartColor;
}

export interface LineRow {
  x: string;
  values: Readonly<Record<string, number | null>>;
}

export interface LineChartProps {
  series: readonly LineSeries[];
  ariaLabel: string;
  formatValue: (value: number, series: LineSeries) => string;
  formatTitle?: ((x: string) => string) | null;
  formatY?: ((value: number) => string) | null;
  yTicks?: readonly number[] | null;
  yDomain?: readonly [number, number] | null;
  showEndMarker?: boolean;
  legend?: LineChartLegend;
  legendLabel?: string | null;
  hiddenSeriesIds?: readonly string[] | null;
  onToggleSeries?: ((id: string) => void) | null;
  height?: number;
  onHighlight?: ((index: number | null) => void) | null;
  loading?: boolean;
  loadingLabel?: string | null;
  empty?: ChartEmptyText | null;
  className?: string;
}
