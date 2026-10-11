import type { Locale } from '@agent-ic/contracts';
import type {
  ChatDividerKind,
  ChatItemKind,
  ChatSpeaker,
} from '@/features/testing/constants/simulator.constants';
import type {
  ChannelKind,
  ConversationState,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

export interface SimulatorSetup {
  versionId: string | null;
  channelKind: ChannelKind;
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
  errorMessage: string | null;
}

export interface SimulatorConversation {
  conversationId: string;
  state: ConversationState;
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
  errorMessage: string | null;
}

export interface ChatDividerItem {
  kind: ChatItemKind.Divider;
  id: string;
  at: string;
  divider: ChatDividerKind;
}

export type ChatItem = ChatMessageItem | ChatTurnItem | ChatDividerItem;

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
