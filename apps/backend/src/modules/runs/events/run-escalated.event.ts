import { z } from 'zod';
import { ConversationMode } from '@/modules/conversations';
import { RunEventName } from '@/modules/runs/constants/run-event.constants';
import { defineDomainEvent } from '@/platform/domain-events/helpers/domain-event.helpers';

export const runEscalatedEvent = defineDomainEvent({
  name: RunEventName.Escalated,
  schema: z.object({
    runId: z.uuid(),
    conversationId: z.uuid(),
    agentId: z.uuid(),
    versionId: z.uuid(),
    nodeId: z.string().min(1),
    mode: z.enum(ConversationMode),
  }),
});
