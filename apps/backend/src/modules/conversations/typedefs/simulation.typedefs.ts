import type { z } from 'zod';
import type {
  ChannelKind,
  CloseReason,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import type { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type {
  operatorConversationSchema,
  operatorReplySchema,
  simulationAgentSchema,
  simulationConversationSchema,
  simulatorMessageSchema,
  startSimulationSchema,
} from '@/modules/conversations/schemas/simulation.schema';

export type SimulationAgentInput = z.input<typeof simulationAgentSchema>;

export type SimulatorMessageInput = z.input<typeof simulatorMessageSchema>;

export type OperatorReplyInput = z.input<typeof operatorReplySchema>;

export type OperatorConversationInput = z.input<typeof operatorConversationSchema>;

export type SimulationConversationInput = z.input<typeof simulationConversationSchema>;

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
  readonly closeReason: CloseReason | null;
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
