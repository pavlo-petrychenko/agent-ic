import { describe, expect, it } from 'vitest';
import { testingSearchSchema } from '@/features/testing/logic/schemas/testingSearch.schema';

describe('testingSearchSchema', () => {
  it('keeps a valid agent id', () => {
    expect(testingSearchSchema.parse({ agent: 'agt_1' })).toEqual({ agent: 'agt_1' });
  });

  it('defaults a missing agent to null', () => {
    expect(testingSearchSchema.parse({})).toEqual({ agent: null });
  });

  it('turns an empty or non-string agent into null', () => {
    expect(testingSearchSchema.parse({ agent: '' })).toEqual({ agent: null });
    expect(testingSearchSchema.parse({ agent: 42 })).toEqual({ agent: null });
  });
});
