import type { EnqueueOptions } from '@/platform/queues/typedefs/job.typedefs';

export enum ConversationEventName {
  MessageReceived = 'conversations.message-received',
  OutboundQueued = 'conversations.outbound-queued',
  NeedsOperator = 'conversations.needs-operator',
}

export const CONVERSATION_EVENT_EMIT_OPTIONS: Readonly<
  Record<ConversationEventName, EnqueueOptions>
> = {
  [ConversationEventName.MessageReceived]: { durable: true },
  [ConversationEventName.OutboundQueued]: { durable: true },
  [ConversationEventName.NeedsOperator]: { durable: false },
};
