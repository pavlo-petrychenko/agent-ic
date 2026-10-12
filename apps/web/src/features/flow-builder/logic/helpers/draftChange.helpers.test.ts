import { describe, expect, it } from 'vitest';
import { isDraftUnchanged } from '@/features/flow-builder/logic/helpers/draftChange.helpers';

describe('isDraftUnchanged', () => {
  it('is unchanged when a live version exists and the draft has no changes', () => {
    expect(isDraftUnchanged(0, 3)).toBe(true);
  });

  it('is changed when the draft has changes or the change count is unknown', () => {
    expect(isDraftUnchanged(2, 3)).toBe(false);
    expect(isDraftUnchanged(null, 3)).toBe(false);
  });

  it('is never unchanged before the first publish', () => {
    expect(isDraftUnchanged(0, null)).toBe(false);
  });
});
