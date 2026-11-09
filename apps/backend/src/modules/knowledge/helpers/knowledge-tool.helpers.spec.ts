import { describe, expect, it } from 'vitest';
import { presentScopeId } from '@/modules/knowledge/helpers/knowledge-tool.helpers';

describe('presentScopeId', () => {
  it('treats null, undefined, empty and blank values as absent', () => {
    expect(presentScopeId(null)).toBeNull();
    expect(presentScopeId(undefined)).toBeNull();
    expect(presentScopeId('')).toBeNull();
    expect(presentScopeId('   ')).toBeNull();
  });

  it('returns a present value trimmed', () => {
    expect(presentScopeId(' ks_abc ')).toBe('ks_abc');
  });
});
