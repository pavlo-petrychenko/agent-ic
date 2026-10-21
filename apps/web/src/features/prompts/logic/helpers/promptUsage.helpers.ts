import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface PromptUsageCounts {
  readonly steps: number;
  readonly versions: number;
}

export const usageCounts = (usages: readonly PromptUsageItem[]): PromptUsageCounts => ({
  steps: new Set(usages.map((usage) => `${usage.agentId}:${usage.nodeId}`)).size,
  versions: usages.length,
});

export const pinnedNumbers = (usages: readonly PromptUsageItem[]): readonly number[] => [
  ...new Set(
    usages.flatMap((usage) => (usage.pinned && usage.pinNumber !== null ? [usage.pinNumber] : [])),
  ),
];
