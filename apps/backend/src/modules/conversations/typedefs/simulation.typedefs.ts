import type { z } from 'zod';
import type {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import type { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type { startSimulationSchema } from '@/modules/conversations/schemas/simulation.schema';

export type StartSimulationInput = z.input<typeof startSimulationSchema>;

export interface SimulationSetup {
  readonly versionId: string | null;
  readonly channelKind: ChannelKind;
  readonly language: string | null;
}

export interface ConversationView {
  readonly id: string;
  readonly state: ConversationState;
  readonly channelKind: ChannelKind;
  readonly language: string | null;
  readonly versionId: string | null;
  readonly createdAt: Date;
}

export interface MessageView {
  readonly id: string;
  readonly author: MessageAuthor;
  readonly text: string;
  readonly quickReplies: readonly string[];
  readonly runId: string | null;
  readonly createdAt: Date;
}

export interface SimulationView {
  readonly conversation: ConversationView;
  readonly messages: readonly MessageView[];
}
