import type { Locale } from '@agent-ic/contracts';
import type { ChatItemKind } from '@/features/testing/constants/simulator.constants';
import type {
  ChannelKind,
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
  messages: readonly SimulatorMessage[];
  runs: readonly SimulatorRun[];
}

export interface ChatMessageItem {
  kind: ChatItemKind.Message;
  id: string;
  at: string;
  message: SimulatorMessage;
}

export interface ChatTurnItem {
  kind: ChatItemKind.Turn;
  id: string;
  at: string;
  run: SimulatorRun | null;
  messages: readonly SimulatorMessage[];
}

export type ChatItem = ChatMessageItem | ChatTurnItem;

export interface SimulatorResult {
  conversation: SimulatorConversation | null;
  starting: boolean;
  failed: boolean;
  sending: boolean;
  restarting: boolean;
  retry: () => void;
  send: (text: string) => Promise<void>;
  restart: () => Promise<void>;
}
