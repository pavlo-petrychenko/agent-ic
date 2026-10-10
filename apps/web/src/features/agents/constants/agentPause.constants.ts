import { PauseMode } from '@/shared/api/generated/schema.generated';

export enum AwayMessageIssue {
  Required = 'required',
  TooLong = 'tooLong',
}

export const PAUSE_MODES: readonly PauseMode[] = [PauseMode.Inbox, PauseMode.AwayMessage];

export const PAUSE_MODE_LABEL_KEYS = {
  [PauseMode.Inbox]: 'pause.modeInbox',
  [PauseMode.AwayMessage]: 'pause.modeAway',
} as const satisfies Readonly<Record<PauseMode, string>>;

export const AWAY_MESSAGE_ROWS = 3;
