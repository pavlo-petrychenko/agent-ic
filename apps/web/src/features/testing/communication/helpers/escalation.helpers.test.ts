import { describe, expect, it } from 'vitest';
import { escalationMessageCount } from '@/features/testing/communication/helpers/escalation.helpers';

describe('escalationMessageCount', () => {
  it('counts the messages an escalation step sent', () => {
    expect(
      escalationMessageCount([
        { messageIds: ['m1'] },
        { mode: 'escalate', messageIds: ['m2', 'm3'], reason: 'help' },
      ]),
    ).toBe(2);
  });

  it('ignores steps that are not an escalation', () => {
    expect(
      escalationMessageCount([
        { mode: 'end', messageIds: ['m1'] },
        { messages: ['Hi'] },
        null,
        'text',
      ]),
    ).toBe(0);
  });

  it('ignores an escalation output without a list of message ids', () => {
    expect(escalationMessageCount([{ mode: 'escalate', messageIds: null }])).toBe(0);
  });
});
