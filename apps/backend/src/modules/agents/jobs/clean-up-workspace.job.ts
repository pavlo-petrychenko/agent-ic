import { AgentJobName } from '@/modules/agents/constants/agent.constants';
import { workspaceDeletedEvent } from '@/modules/identity';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const cleanUpWorkspaceJob = defineDomainEventSubscription({
  event: workspaceDeletedEvent,
  queue: QueueName.Timers,
  name: AgentJobName.CleanUpWorkspace,
});
