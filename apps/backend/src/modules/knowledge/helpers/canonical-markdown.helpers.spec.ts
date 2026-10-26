import { describe, expect, it } from 'vitest';
import { canonicalizeMarkdown } from '@/modules/knowledge/helpers/canonical-markdown.helpers';

describe('canonicalizeMarkdown', () => {
  it('removes a byte order mark and normalizes line endings', () => {
    expect(canonicalizeMarkdown('\uFEFF# Pricing\r\n\r\nGift cards\r\n')).toBe(
      '# Pricing\n\nGift cards\n',
    );
  });

  it('removes null characters and trailing whitespace', () => {
    expect(canonicalizeMarkdown('Pricing\u0000   \n\n')).toBe('Pricing\n');
  });

  it('keeps an empty document empty', () => {
    expect(canonicalizeMarkdown(' \r\n\t')).toBe('');
  });
});
