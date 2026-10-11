import { describe, expect, it } from 'vitest';
import { pickAgent } from '@/features/testing/logic/helpers/agent.helpers';

const AGENTS = [
  { id: 'agt_a', name: 'A', draftNumber: 1 },
  { id: 'agt_b', name: 'B', draftNumber: 2 },
];

describe('pickAgent', () => {
  it('picks the requested agent, else the first one', () => {
    expect(pickAgent(AGENTS, 'agt_b')?.name).toBe('B');
    expect(pickAgent(AGENTS, 'agt_gone')?.name).toBe('A');
    expect(pickAgent(AGENTS, null)?.name).toBe('A');
  });

  it('returns null while there are no agents', () => {
    expect(pickAgent(null, 'agt_a')).toBeNull();
    expect(pickAgent([], null)).toBeNull();
  });
});
