import { describe, expect, it } from 'vitest';
import { rowBatches } from '@/platform/database/helpers/row-batch.helpers';

describe('rowBatches', () => {
  it('splits rows into batches and keeps the last partial batch', () => {
    expect(rowBatches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(rowBatches([], 2)).toEqual([]);
  });
});
