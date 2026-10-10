import { AGENT_AWAY_MESSAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { AwayMessageIssue } from '@/features/agents/constants/agentPause.constants';
import { validateAwayMessage } from '@/features/agents/logic/helpers/agentPause.helpers';

describe('validateAwayMessage', () => {
  it('accepts a message within the limit', () => {
    expect(validateAwayMessage('Back at nine')).toBeNull();
    expect(validateAwayMessage('a'.repeat(AGENT_AWAY_MESSAGE_MAX_LENGTH))).toBeNull();
  });

  it('requires text that is not only spaces', () => {
    expect(validateAwayMessage('')).toBe(AwayMessageIssue.Required);
    expect(validateAwayMessage('   ')).toBe(AwayMessageIssue.Required);
  });

  it('refuses a message over the limit', () => {
    expect(validateAwayMessage('a'.repeat(AGENT_AWAY_MESSAGE_MAX_LENGTH + 1))).toBe(
      AwayMessageIssue.TooLong,
    );
  });

  it('measures the limit without the surrounding spaces', () => {
    expect(validateAwayMessage(` ${'a'.repeat(AGENT_AWAY_MESSAGE_MAX_LENGTH)} `)).toBeNull();
  });
});
