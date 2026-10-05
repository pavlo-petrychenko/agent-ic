import type { ChartColor, LegendMarkerKind } from '@/shared/ui/display/Legend/Legend.constants';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { StatusKind } from '@/shared/ui/display/StatusDot';

export interface LegendStatusMarker {
  kind: LegendMarkerKind.Status;
  status: StatusKind;
}

export interface LegendSeriesMarker {
  kind: LegendMarkerKind.Series;
  color: ChartColor;
}

export interface LegendHueMarker {
  kind: LegendMarkerKind.Hue;
  hue: NodeKind;
}

export type LegendMarker = LegendStatusMarker | LegendSeriesMarker | LegendHueMarker;

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
