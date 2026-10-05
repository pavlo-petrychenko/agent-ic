import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export enum RunNodeState {
  Done = 'done',
  Running = 'running',
  Waiting = 'waiting',
  Skipped = 'skipped',
  Failed = 'failed',
}

export const RUN_NODE_STATUS_ICON_SIZE = 13;

export const RUN_NODE_STATUS_ICONS: Readonly<Record<RunNodeState, IconName | null>> = {
  [RunNodeState.Done]: IconName.Check,
  [RunNodeState.Running]: IconName.Spinner,
  [RunNodeState.Waiting]: null,
  [RunNodeState.Skipped]: null,
  [RunNodeState.Failed]: IconName.Alert,
};

export const RUN_NODE_VISIBLE_LABEL_STATES: ReadonlySet<RunNodeState> = new Set([
  RunNodeState.Running,
]);
