import type { EnqueueOptions } from '@/platform/queues/typedefs/job.typedefs';

export enum ConversationEventName {
  MessageReceived = 'conversations.message-received',
  OutboundQueued = 'conversations.outbound-queued',
  NeedsOperator = 'conversations.needs-operator',
}

export const DURABLE_EVENT_OPTIONS: EnqueueOptions = { durable: true };
