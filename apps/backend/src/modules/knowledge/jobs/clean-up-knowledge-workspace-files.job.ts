import { workspaceDeletedEvent } from '@/modules/identity';
import { KnowledgeJobName } from '@/modules/knowledge/constants/knowledge-job.constants';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const cleanUpKnowledgeWorkspaceFilesJob = defineDomainEventSubscription({
  event: workspaceDeletedEvent,
  queue: QueueName.Timers,
  name: KnowledgeJobName.CleanUpWorkspaceFiles,
});
