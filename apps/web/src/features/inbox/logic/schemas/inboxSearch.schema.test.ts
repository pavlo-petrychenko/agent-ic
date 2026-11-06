import { describe, expect, it } from 'vitest';
import { inboxSearchSchema } from '@/features/inbox/logic/schemas/inboxSearch.schema';

describe('inboxSearchSchema', () => {
  it('keeps a conversation id', () => {
    expect(inboxSearchSchema.parse({ conversation: 'cnv_1' })).toEqual({ conversation: 'cnv_1' });
  });

  it('defaults a missing conversation to null', () => {
    expect(inboxSearchSchema.parse({})).toEqual({ conversation: null });
  });

  it('turns an empty or invalid conversation into null', () => {
    expect(inboxSearchSchema.parse({ conversation: '' })).toEqual({ conversation: null });
    expect(inboxSearchSchema.parse({ conversation: 42 })).toEqual({ conversation: null });
  });
});
