import { Locale } from '@agent-ic/contracts';
import { ChannelKind, RunStatus } from '@/shared/api/generated/schema.generated';

export const SETUP_KEY_SEPARATOR = '|';

export enum ChatItemKind {
  Message = 'message',
  Turn = 'turn',
}

export const ACTIVE_RUN_STATUSES: ReadonlySet<RunStatus> = new Set([
  RunStatus.Queued,
  RunStatus.Running,
]);

export const SIMULATOR_CHANNELS: readonly ChannelKind[] = [ChannelKind.Simulated];

export const SIMULATOR_LANGUAGES: readonly Locale[] = [Locale.Uk, Locale.En];
