import { describe, expect, it } from 'vitest';
import { documentContentHash } from '@/modules/knowledge/helpers/document-content-hash.helpers';

describe('documentContentHash', () => {
  it('hashes the same markdown to the same value', () => {
    const markdown = '# Pricing\n\nGift cards\n';

    expect(documentContentHash(markdown)).toBe(documentContentHash(markdown));
    expect(documentContentHash(markdown)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when the markdown changes', () => {
    expect(documentContentHash('Pricing')).not.toBe(documentContentHash('Pricing '));
  });
});
