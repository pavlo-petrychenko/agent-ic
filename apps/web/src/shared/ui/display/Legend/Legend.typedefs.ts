import type { ChartColor, LegendMarkerKind } from '@/shared/ui/display/Legend/Legend.constants';
import type { StatusKind } from '@/shared/ui/display/StatusDot';

export interface LegendStatusMarker {
  kind: LegendMarkerKind.Status;
  status: StatusKind;
}

export interface LegendSeriesMarker {
  kind: LegendMarkerKind.Series;
  color: ChartColor;
}

export type LegendMarker = LegendStatusMarker | LegendSeriesMarker;

export interface LegendItem {
  id: string;
  label: string;
  marker: LegendMarker;
}

export interface LegendProps {
  items: readonly LegendItem[];
  hiddenIds?: readonly string[] | null;
  onToggle?: ((id: string) => void) | null;
  ariaLabel?: string | null;
  className?: string;
}
