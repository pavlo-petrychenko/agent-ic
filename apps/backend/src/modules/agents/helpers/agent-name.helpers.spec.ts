import { AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { uniqueAgentName } from '@/modules/agents/helpers/agent-name.helpers';

const NAME = 'New agent';
const LONG_NAME = 'a'.repeat(AGENT_NAME_MAX_LENGTH);

describe('uniqueAgentName', () => {
  it('keeps a name nobody uses', () => {
    expect(uniqueAgentName(NAME, ['New agent copy'])).toBe(NAME);
  });

  it('numbers a taken name from two', () => {
    expect(uniqueAgentName(NAME, [NAME])).toBe('New agent 2');
  });

  it('takes the first free number', () => {
    expect(uniqueAgentName(NAME, [NAME, 'New agent 2', 'New agent 4'])).toBe('New agent 3');
  });

  it('shortens a long name so the number fits', () => {
    const name = uniqueAgentName(LONG_NAME, [LONG_NAME]);

    expect(name).toHaveLength(AGENT_NAME_MAX_LENGTH);
    expect(name.endsWith(' 2')).toBe(true);
  });
});
