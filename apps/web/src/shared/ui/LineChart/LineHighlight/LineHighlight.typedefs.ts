import type { ChartBounds } from '@/shared/ui/ChartTooltip';
import type { ChartColor } from '@/shared/ui/Legend';
import type { LineRow, LineSeries } from '@/shared/ui/LineChart/LineChart.typedefs';

export interface LineMarker {
  id: string;
  color: ChartColor;
  cx: number;
  cy: number;
}

export interface LineHighlightTooltip {
  host: HTMLElement;
  id: string;
  bounds: ChartBounds;
  formatTitle: (x: string) => string;
  formatValue: (value: number, series: LineSeries) => string;
}

export interface LineHighlightProps {
  rows: readonly LineRow[];
  series: readonly LineSeries[];
  index: number | null;
  showEndMarker: boolean;
  tooltip: LineHighlightTooltip | null;
}
