import type { ConversationMode } from '@/modules/conversations/constants/conversation.constants';

export interface InactivityScope {
  readonly agentId: string;
  readonly mode: ConversationMode;
  readonly simulationVersionId: string | null;
  readonly silentSince: Date;
}

export type CloseInactiveConversationsInput = Readonly<Record<string, never>>;
