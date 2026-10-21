import { workspaceDeletedEvent } from '@/modules/identity';
import { LlmKeyJobName } from '@/modules/llm-keys/constants/llm-key-job.constants';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const cleanUpWorkspaceJob = defineDomainEventSubscription({
  event: workspaceDeletedEvent,
  queue: QueueName.Timers,
  name: LlmKeyJobName.CleanUpWorkspace,
});
