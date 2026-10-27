import { Locale } from '@agent-ic/contracts';
import {
  ChannelConversationKind,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

export const SETUP_KEY_SEPARATOR = '|';

export enum ChatItemKind {
  Message = 'message',
  Turn = 'turn',
  Divider = 'divider',
}

export enum ChatDividerKind {
  Escalated = 'escalated',
  HandedBack = 'handedBack',
}

export enum ComposerMode {
  User = 'user',
  Escalated = 'escalated',
  Operator = 'operator',
}

export const DIVIDER_ID_SEPARATOR = ':';

export enum ChatSpeaker {
  User = 'user',
  Agent = 'agent',
  Operator = 'operator',
  System = 'system',
}

export const MESSAGE_SPEAKERS: Readonly<Record<MessageAuthor, ChatSpeaker>> = {
  [MessageAuthor.Customer]: ChatSpeaker.User,
  [MessageAuthor.Agent]: ChatSpeaker.Agent,
  [MessageAuthor.Operator]: ChatSpeaker.Operator,
  [MessageAuthor.System]: ChatSpeaker.System,
};

export const ACTIVE_RUN_STATUSES: ReadonlySet<RunStatus> = new Set([
  RunStatus.Queued,
  RunStatus.Running,
]);

export const SIMULATOR_CHANNELS: readonly ChannelConversationKind[] = [
  ChannelConversationKind.Simulated,
];

export const SIMULATOR_LANGUAGES: readonly Locale[] = [Locale.Uk, Locale.En];
