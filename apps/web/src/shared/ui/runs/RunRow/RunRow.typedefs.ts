import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import type { RunStatus } from '@/shared/ui/runs/RunRow/RunRow.constants';

export interface RunRowAnchorProps extends Omit<ComponentProps<'a'>, 'children' | 'title'> {
  title: string;
  time: string;
  dateTime: string;
  status: RunStatus;
  statusLabel: string;
  detail: readonly string[];
  triggerIcon?: IconName | null;
  quality?: string | null;
  selected?: boolean;
}
