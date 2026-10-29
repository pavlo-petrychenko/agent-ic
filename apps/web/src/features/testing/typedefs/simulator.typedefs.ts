import type { Locale } from '@agent-ic/contracts';
import type {
  ChatEventKind,
  ChatItemKind,
  ChatSpeaker,
} from '@/features/testing/constants/simulator.constants';
import type {
  ChannelConversationKind,
  ConversationCloseReason,
  ConversationState,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

export interface SimulatorSetup {
  versionId: string | null;
  channelKind: ChannelConversationKind;
  language: Locale;
}

export interface SimulatorMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  runId: string | null;
  createdAt: string;
}

export interface SimulatorRun {
  id: string;
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
  retry: () => void;
  send: (text: string) => Promise<void>;
  restart: () => Promise<void>;
  reply: (text: string) => Promise<void>;
  handBack: () => Promise<void>;
}
