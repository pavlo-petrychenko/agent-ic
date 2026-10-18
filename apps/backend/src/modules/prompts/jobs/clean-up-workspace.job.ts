import { workspaceDeletedEvent } from '@/modules/identity';
import { PromptJobName } from '@/modules/prompts/constants/prompt-job.constants';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const cleanUpWorkspaceJob = defineDomainEventSubscription({
  event: workspaceDeletedEvent,
  queue: QueueName.Timers,
  name: PromptJobName.CleanUpWorkspace,
});
