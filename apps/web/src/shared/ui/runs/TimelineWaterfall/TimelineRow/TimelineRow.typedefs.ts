import type { LabelSide } from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.constants';
import type { TimelineRowData } from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.typedefs';

export interface TimelineRowProps {
  row: TimelineRowData;
  totalMs: number;
  trackWidth: number;
  labelWidth: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

export interface BarGeometry {
  x: number;
  width: number;
  labelX: number;
  labelSide: LabelSide;
}
