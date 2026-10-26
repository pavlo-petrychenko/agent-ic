import { describe, expect, it } from 'vitest';
import { contentHash } from '@/modules/knowledge/helpers/content-hash.helpers';

describe('contentHash', () => {
  it('hashes content with SHA-256 and hex encoding', () => {
    expect(contentHash('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('changes when the content changes', () => {
    expect(contentHash('Pricing')).not.toBe(contentHash('Pricing '));
  });
});
