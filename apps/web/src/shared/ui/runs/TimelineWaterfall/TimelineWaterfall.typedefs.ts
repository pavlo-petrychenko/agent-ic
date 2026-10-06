import type { TraceStepKind } from '@/shared/ui/runs/TraceRow/TraceRow.constants';

export interface TimelineRowData {
  id: string;
  label: string;
  depth: number;
  startMs: number;
  durationMs: number;
  kind: TraceStepKind;
  durationLabel: string;
  description: string;
}

export interface TimelineTick {
  valueMs: number;
  label: string;
}

export interface TimelineWaterfallProps {
  rows: readonly TimelineRowData[];
  totalMs: number;
  ticks: readonly TimelineTick[];
  ariaLabel: string;
  legendLabels: Readonly<Record<TraceStepKind, string>>;
  legendAriaLabel: string;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  caption?: string | null;
  labelWidth?: number;
  className?: string;
}
