import { RunStatus } from '@/shared/api/generated/schema.generated';

export const SETUP_KEY_SEPARATOR = '|';

export enum ChatItemKind {
  Message = 'message',
  Turn = 'turn',
}

export const ACTIVE_RUN_STATUSES: ReadonlySet<RunStatus> = new Set([
  RunStatus.Queued,
  RunStatus.Running,
]);
