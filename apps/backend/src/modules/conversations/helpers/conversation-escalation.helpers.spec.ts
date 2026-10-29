import { describe, expect, it } from 'vitest';
import { hasNeverEscalated } from '@/modules/conversations/helpers/conversation-escalation.helpers';

describe('hasNeverEscalated', () => {
  it('is true only while the conversation has no escalation time', () => {
    expect(hasNeverEscalated({ lastEscalatedAt: null })).toBe(true);
    expect(hasNeverEscalated({ lastEscalatedAt: new Date() })).toBe(false);
  });
});
