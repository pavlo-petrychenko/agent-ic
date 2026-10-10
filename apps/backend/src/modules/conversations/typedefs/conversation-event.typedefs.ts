import type { z } from 'zod';
import type { messageReceivedEvent } from '@/modules/conversations/events/message-received.event';
import type { needsOperatorEvent } from '@/modules/conversations/events/needs-operator.event';
import type { outboundQueuedEvent } from '@/modules/conversations/events/outbound-queued.event';

export type MessageReceivedPayload = z.infer<typeof messageReceivedEvent.schema>;

export type OutboundQueuedPayload = z.infer<typeof outboundQueuedEvent.schema>;

export type NeedsOperatorPayload = z.infer<typeof needsOperatorEvent.schema>;
