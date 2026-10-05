import type { ChartTooltipPlacement } from '@/shared/ui/ChartTooltip/ChartTooltip.constants';
import type { ChartColor } from '@/shared/ui/Legend';

export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartBounds {
  width: number;
  height: number;
}

export interface ChartTooltipRow {
  id: string;
  label: string | null;
  value: string;
  color: ChartColor | null;
}

export interface ChartTooltipProps {
  id?: string;
  title: string;
  rows: readonly ChartTooltipRow[];
  anchor: ChartPoint;
  placement: ChartTooltipPlacement;
  bounds?: ChartBounds | null;
  visible?: boolean;
  className?: string;
}

export interface ChartHighlightKeyEvent {
  key: string;
  preventDefault: () => void;
}

export interface ChartHighlightOptions {
  count: number;
  onHighlight?: ((index: number | null) => void) | null;
}

export interface ChartHighlight {
  index: number | null;
  setIndex: (index: number | null) => void;
  onKeyDown: (event: ChartHighlightKeyEvent) => void;
}
