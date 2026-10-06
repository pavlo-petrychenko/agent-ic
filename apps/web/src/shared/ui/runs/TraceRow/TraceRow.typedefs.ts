import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import type { TraceStepKind } from '@/shared/ui/runs/TraceRow/TraceRow.constants';

export interface TraceRowProps extends Omit<
  ComponentProps<'div'>,
  'children' | 'onSelect' | 'role' | 'aria-level' | 'aria-selected' | 'aria-expanded'
> {
  depth: number;
  kind: TraceStepKind;
  name: string;
  icon?: IconName | null;
  durationLabel?: string | null;
  errorLabel?: string | null;
  running?: boolean;
  expanded?: boolean | null;
  selected?: boolean;
  onSelect: () => void;
  onToggleExpanded?: (() => void) | null;
}
