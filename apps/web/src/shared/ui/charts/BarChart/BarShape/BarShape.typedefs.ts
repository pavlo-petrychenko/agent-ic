import type { BarTone } from '@/shared/ui/charts/BarChart/BarChart.constants';
import type { ChartBounds, ChartTooltipRow } from '@/shared/ui/charts/ChartTooltip';

export interface BarShapeTooltip {
  host: HTMLElement;
  id: string;
  title: string;
  rows: readonly ChartTooltipRow[];
  bounds: ChartBounds;
}

export interface BarShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  tone: BarTone;
  tooltip: BarShapeTooltip | null;
}
