import { describe, expect, it } from 'vitest';
import { AgentStatus } from '@/features/agents/constants/agentStatus.constants';
import { filterAgents, toStatuses } from '@/features/agents/logic/helpers/agentFilter.helpers';
import type { AgentListItem } from '@/features/agents/typedefs/agent.typedefs';

const buildAgent = (overrides: Partial<AgentListItem>): AgentListItem => ({
  id: 'agt_1',
  name: 'Agent',
  description: null,
  status: AgentStatus.Draft,
  liveVersionNumber: null,
  draftNumber: 1,
  hasUnpublishedChanges: true,
  versionCount: 1,
  ...overrides,
});

const SALON = buildAgent({ id: 'salon', name: 'Salon assistant', status: AgentStatus.Live });
const GIFT = buildAgent({ id: 'gift', name: 'Gift card FAQ', status: AgentStatus.Paused });
const REVIEW = buildAgent({
  id: 'review',
  name: 'Collector',
  description: 'Asks for a review after a visit',
});
const AGENTS = [SALON, GIFT, REVIEW];

const ids = (agents: readonly AgentListItem[]) => agents.map((agent) => agent.id);

describe('filterAgents', () => {
  it('keeps everything without a query or a status', () => {
    expect(ids(filterAgents(AGENTS, '  ', []))).toEqual(['salon', 'gift', 'review']);
  });

  it('matches the name ignoring case', () => {
    expect(ids(filterAgents(AGENTS, 'GIFT', []))).toEqual(['gift']);
  });

  it('matches the description', () => {
    expect(ids(filterAgents(AGENTS, 'review after', []))).toEqual(['review']);
  });

  it('keeps only the chosen statuses', () => {
    expect(ids(filterAgents(AGENTS, '', [AgentStatus.Live, AgentStatus.Paused]))).toEqual([
      'salon',
      'gift',
    ]);
  });

  it('combines the query and the statuses', () => {
    expect(filterAgents(AGENTS, 'salon', [AgentStatus.Paused])).toEqual([]);
  });
});

describe('toStatuses', () => {
  it('drops ids that are not statuses', () => {
    expect(toStatuses(['paused', 'archived', 'live'])).toEqual([
      AgentStatus.Live,
      AgentStatus.Paused,
    ]);
  });
});
