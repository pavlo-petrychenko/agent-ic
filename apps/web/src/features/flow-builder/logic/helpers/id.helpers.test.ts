import { describe, expect, it } from 'vitest';
import { newElementId } from '@/features/flow-builder/logic/helpers/id.helpers';

describe('id helpers', () => {
  it('returns a different non-empty id on every call', () => {
    const first = newElementId();
    const second = newElementId();

    expect(first).not.toBe('');
    expect(second).not.toBe(first);
  });
});
