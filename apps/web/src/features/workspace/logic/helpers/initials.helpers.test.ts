import { describe, expect, it } from 'vitest';
import { toInitials } from '@/features/workspace/logic/helpers/initials.helpers';

describe('toInitials', () => {
  it('takes the first letters of up to two words', () => {
    expect(toInitials('Demo salon')).toBe('DS');
    expect(toInitials(' yulia ')).toBe('Y');
    expect(toInitials('Taras B. Shevchenko')).toBe('TB');
  });
});
