import type { Locale } from '@agent-ic/contracts';
import type {
  ChatEventKind,
  ChatItemKind,
  ChatSpeaker,
  WRITE_AS_MODES,
} from '@/features/testing/constants/simulator.constants';
import type {
  ChannelConversationKind,
  ConversationCloseReason,
  ConversationState,
  MessageAuthor,
  RunStatus,
  RunTrigger,
} from '@/shared/api/generated/schema.generated';

export interface SimulatorSetup {
  versionId: string | null;
  channelKind: ChannelConversationKind;
  language: Locale;
}

export type WriteAs = (typeof WRITE_AS_MODES)[number];

export interface SimulatorMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  runId: string | null;
  createdAt: string;
}

export interface SimulatorRun {
  id: string;
  trigger: RunTrigger;
  inactivityAttempt: number | null;
  status: RunStatus;
  createdAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  escalationMessageCount: number;
  escalatedByStep: boolean;
}

export interface SimulatorConversation {
  conversationId: string;
  state: ConversationState;
  closeReason: ConversationCloseReason | null;
  closedAt: string | null;
  messages: readonly SimulatorMessage[];
  runs: readonly SimulatorRun[];
}

export interface ChatMessageItem {
  kind: ChatItemKind.Message;
  id: string;
  at: string;
  speaker: ChatSpeaker;
  text: string;
}

export interface ChatTurnItem {
  kind: ChatItemKind.Turn;
  id: string;
  at: string;
  messages: readonly SimulatorMessage[];
  trigger: RunTrigger;
  attempt: number | null;
  failed: boolean;
  escalated: boolean;
  escalatedByStep: boolean;
  handedBack: boolean;
  escalationMessageCount: number;
  errorMessage: string | null;
  finishedAt: string | null;
}

export interface ChatEventItem {
  kind: ChatItemKind.Event;
  id: string;
  at: string | null;
  event: ChatEventKind;
  minutes: number | null;
}

export type ChatItem = ChatMessageItem | ChatTurnItem | ChatEventItem;

export interface ChatConversation {
  state: ConversationState;
  closeReason: ConversationCloseReason | null;
  closedAt: string | null;
}

export interface SimulatorResult {
  conversation: SimulatorConversation | null;
  starting: boolean;
  failed: boolean;
  loadFailed: boolean;
  sending: boolean;
  restarting: boolean;
  replying: boolean;
  handingBack: boolean;
  closingInactive: boolean;
  simulatingSilence: boolean;
  retry: () => void;
  send: (text: string) => Promise<void>;
  restart: () => Promise<void>;
  reply: (text: string) => Promise<void>;
  handBack: () => Promise<void>;
  closeForInactivity: () => Promise<void>;
  simulateSilence: () => Promise<void>;
}
