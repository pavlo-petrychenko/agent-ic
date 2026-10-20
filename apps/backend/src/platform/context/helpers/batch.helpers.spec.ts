import { describe, expect, it } from 'vitest';
import { groupByKey, indexByKey } from '@/platform/context/helpers/batch.helpers';

interface Step {
  readonly id: string;
  readonly runId: string;
}

const steps: readonly Step[] = [
  { id: 'step_1', runId: 'run_a' },
  { id: 'step_2', runId: 'run_b' },
  { id: 'step_3', runId: 'run_a' },
  { id: 'step_4', runId: 'run_unknown' },
];

const runIdOf = (step: Step): string => step.runId;

describe('groupByKey', () => {
  it('holds every key, with an empty group for a key without items, in the order of the items', () => {
    const groups = groupByKey(['run_a', 'run_b', 'run_c'], steps, runIdOf);

    expect([...groups.entries()]).toEqual([
      ['run_a', [steps[0], steps[2]]],
      ['run_b', [steps[1]]],
      ['run_c', []],
    ]);
  });
});

describe('indexByKey', () => {
  it('holds every key, with null for a key without an item, and ignores items of other keys', () => {
    const index = indexByKey(['run_b', 'run_c'], steps, runIdOf);

    expect([...index.entries()]).toEqual([
      ['run_b', steps[1]],
      ['run_c', null],
    ]);
  });
});
