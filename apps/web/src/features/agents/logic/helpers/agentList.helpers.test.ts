import { describe, expect, it } from 'vitest';
import { toTableStatus } from '@/features/agents/logic/helpers/agentList.helpers';
import { TableStatus } from '@/shared/ui/data/Table';

describe('toTableStatus', () => {
  it.each([
    [true, false, TableStatus.Loading],
    [false, true, TableStatus.Error],
    [false, false, TableStatus.Ready],
  ])('maps loading %s and failed %s', (loading, failed, expected) => {
    expect(toTableStatus(loading, failed)).toBe(expected);
  });
});
