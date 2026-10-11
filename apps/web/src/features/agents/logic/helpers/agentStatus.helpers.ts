import { AgentStatusNote } from '@/features/agents/constants/agentStatus.constants';
import type { AgentListItem } from '@/features/agents/typedefs/agent.typedefs';

export const agentStatusNote = (agent: AgentListItem): AgentStatusNote | null => {
  if (agent.liveVersionNumber === null) {
    return AgentStatusNote.NeverPublished;
  }
  return agent.hasUnpublishedChanges ? AgentStatusNote.DraftInProgress : null;
};
