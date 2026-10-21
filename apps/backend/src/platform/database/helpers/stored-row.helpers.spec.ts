import { describe, expect, it } from 'vitest';
import { MissingStoredRowError } from '@/platform/database/errors/missing-stored-row.error';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';

const ROW = { id: 'stored' };

describe('storedRow', () => {
  it('returns the row a write gave back', () => {
    expect(storedRow([ROW])).toBe(ROW);
  });

  it('fails when the write gave back no row', () => {
    expect(() => storedRow([])).toThrow(MissingStoredRowError);
  });
});
