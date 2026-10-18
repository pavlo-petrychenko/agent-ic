import { describe, expect, it } from 'vitest';
import { pinnedNumbers, usageCounts } from '@/features/prompts/logic/helpers/promptUsage.helpers';
import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

const usage = (overrides: Partial<PromptUsageItem> = {}): PromptUsageItem => ({
  agentId: 'agt_1',
  agentName: 'Salon assistant',
  versionId: 'agv_1',
  live: false,
  versionNumber: null,
  nodeId: 'n_reception',
  nodeKey: 'reception',
  nodeLabel: 'Receptionist',
  pinned: true,
  pinNumber: 4,
  ...overrides,
});

describe('usageCounts', () => {
  it('counts one step once across its versions', () => {
    const counts = usageCounts([
      usage({ versionId: 'agv_live', live: true, versionNumber: 3 }),
      usage(),
    ]);

    expect(counts).toEqual({ steps: 1, versions: 2 });
  });

  it('counts the same step of two agents as two steps', () => {
    const counts = usageCounts([usage(), usage({ agentId: 'agt_2', versionId: 'agv_2' })]);

    expect(counts).toEqual({ steps: 2, versions: 2 });
  });

  it('counts nothing for no usages', () => {
    expect(usageCounts([])).toEqual({ steps: 0, versions: 0 });
  });
});

describe('pinnedNumbers', () => {
  it('lists the pinned numbers once each, without follow-latest pins', () => {
    const numbers = pinnedNumbers([
      usage(),
      usage({ versionId: 'agv_2' }),
      usage({ versionId: 'agv_3', pinned: false, pinNumber: null }),
      usage({ versionId: 'agv_4', pinned: true, pinNumber: 2 }),
    ]);

    expect(numbers).toEqual([4, 2]);
  });
});
