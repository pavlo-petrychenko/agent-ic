import { describe, expect, it } from 'vitest';
import { AgentStatus, AgentStatusNote } from '@/features/agents/constants/agentStatus.constants';
import { agentStatusNote } from '@/features/agents/logic/helpers/agentStatus.helpers';
import type { AgentListItem } from '@/features/agents/typedefs/agent.typedefs';

const AGENT: AgentListItem = {
  id: 'agt_1',
  name: 'Agent',
  description: null,
  status: AgentStatus.Live,
  liveVersionNumber: 3,
  draftNumber: 4,
  hasUnpublishedChanges: false,
  versionCount: 3,
};

describe('agentStatusNote', () => {
  it.each([
    ['never published', { liveVersionNumber: null }, AgentStatusNote.NeverPublished],
    ['live with edits', { hasUnpublishedChanges: true }, AgentStatusNote.DraftInProgress],
    ['live without edits', {}, null],
  ])('describes %s', (_name, overrides, note) => {
    expect(agentStatusNote({ ...AGENT, ...overrides })).toBe(note);
  });
});
