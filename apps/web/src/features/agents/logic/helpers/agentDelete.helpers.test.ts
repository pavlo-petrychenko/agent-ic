import { describe, expect, it } from 'vitest';
import { isDeleteConfirmed } from '@/features/agents/logic/helpers/agentDelete.helpers';

describe('isDeleteConfirmed', () => {
  it('confirms the exact name', () => {
    expect(isDeleteConfirmed('Salon assistant', 'Salon assistant')).toBe(true);
  });

  it('ignores spaces around the typed name', () => {
    expect(isDeleteConfirmed('  Salon assistant ', 'Salon assistant')).toBe(true);
  });

  it('refuses a partial or differently cased name', () => {
    expect(isDeleteConfirmed('Salon assist', 'Salon assistant')).toBe(false);
    expect(isDeleteConfirmed('salon assistant', 'Salon assistant')).toBe(false);
    expect(isDeleteConfirmed('', 'Salon assistant')).toBe(false);
  });
});
